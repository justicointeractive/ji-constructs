import { Duration } from 'aws-cdk-lib';
import {
  BehaviorOptions,
  CachePolicy,
  CacheQueryStringBehavior,
  Distribution,
  DistributionProps,
  KeyGroup,
  LambdaEdgeEventType,
  OriginAccessIdentity,
  PublicKey,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin, S3OriginProps } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Function as Lambda } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, BucketProps, IBucket } from 'aws-cdk-lib/aws-s3';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { LambdaNpmFunction } from 'cdk-lambda-npm-function';
import { Construct } from 'constructs';
import { resolve } from 'path';
import { ImageResizeInventory } from './image-resize-inventory';

export type ImageResizeBehaviorProps = {
  /**
   * set to false to attach this behavior to an existing distribution
   * @default true
   */
  createDistribution?: boolean;
  s3BucketOrProps?: Bucket | BucketProps;
  /** if provided, content must be accessed using urls signed with the private key from this key pair */
  signedUrlPublicKey?: string | ISecret;

  // props for lower level overrides
  s3OriginProps?: Partial<S3OriginProps>;
  originResponseLambdaProps?: NodejsFunctionProps;
  viewerRequestLambdaProps?: NodejsFunctionProps;
  cloudfrontDistributionProps?: DistributionProps;
  embedRootDir?: string;
};

export class ImageResizeBehavior extends Construct {
  sourceBucket: IBucket;
  resizedBucket: IBucket;
  imageOriginResponseLambda: Lambda;
  imageViewerRequestLambda: Lambda;
  behaviorOptions: BehaviorOptions;
  distribution?: Distribution;
  imageResizeInventory: ImageResizeInventory;

  constructor(
    scope: Construct,
    id: string,
    props: ImageResizeBehaviorProps = {}
  ) {
    super(scope, id);

    const {
      createDistribution = true,
      s3BucketOrProps,
      s3OriginProps,
      originResponseLambdaProps,
      viewerRequestLambdaProps,
      cloudfrontDistributionProps,
      embedRootDir = `${__dirname}/../../embedded`, // src/lib/../../embedded
      signedUrlPublicKey,
    } = props;

    this.sourceBucket =
      s3BucketOrProps instanceof Bucket
        ? s3BucketOrProps
        : new Bucket(this, 'Bucket', s3BucketOrProps);

    this.resizedBucket =
      // TODO: read-only access to source bucket
      this.sourceBucket;

    this.imageResizeInventory = new ImageResizeInventory(this, 'Inventory', {
      embedRootDir,
      bucket: this.resizedBucket,
    });

    this.imageOriginResponseLambda = new LambdaNpmFunction(
      this,
      'OriginResponseFunction',
      {
        projectRoot: resolve(
          `${embedRootDir}/packages/lambdas/image-resize-origin-response-function`
        ),
        timeout: Duration.seconds(15),
        memorySize: 1024 * 2, // per performance tuner 2048 MB had best cost/performance
        ...originResponseLambdaProps,
      }
    );

    this.sourceBucket.grantRead(this.imageOriginResponseLambda);
    this.resizedBucket.grantPut(this.imageOriginResponseLambda);
    this.imageResizeInventory.derrivedImagesTable.grantWriteData(
      this.imageOriginResponseLambda
    );

    this.imageViewerRequestLambda = new LambdaNpmFunction(
      this,
      'ViewerRequestFunction',
      {
        projectRoot: resolve(
          `${embedRootDir}/packages/lambdas/image-resize-viewer-request-function`
        ),
        ...viewerRequestLambdaProps,
      }
    );

    const cachePolicy = new CachePolicy(this, 'CachePolicy', {
      defaultTtl: Duration.days(365), // 1 year
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
      maxTtl: Duration.days(365 * 2), // 2 years
      minTtl: Duration.days(30 * 3), // 3 months
      queryStringBehavior: CacheQueryStringBehavior.allowList(
        'height',
        'width'
      ),
    });

    const originAccessIdentity = new OriginAccessIdentity(this, 'OAI');
    this.resizedBucket.grantRead(originAccessIdentity);

    const signedUrlEncodedKey =
      signedUrlPublicKey == null
        ? signedUrlPublicKey
        : typeof signedUrlPublicKey === 'string'
        ? signedUrlPublicKey
        : signedUrlPublicKey.secretValue.unsafeUnwrap();

    const signedUrlKeyGroups =
      signedUrlEncodedKey != null
        ? [
            new KeyGroup(this, 'KeyGroup', {
              items: [
                new PublicKey(this, 'PublicKey', {
                  encodedKey: signedUrlEncodedKey,
                }),
              ],
            }),
          ]
        : undefined;

    this.behaviorOptions = {
      origin: new S3Origin(this.resizedBucket, {
        ...s3OriginProps,
        originAccessIdentity,
        customHeaders: {
          ...s3OriginProps?.customHeaders,
          'x-image-resize-inventory-table-name':
            this.imageResizeInventory.derrivedImagesTable.tableName,
          'x-image-resize-inventory-source-bucket-arn':
            this.sourceBucket.bucketArn,
          'x-image-resize-inventory-resized-bucket-arn':
            this.resizedBucket.bucketArn,
        },
      }),
      cachePolicy,
      edgeLambdas: [
        {
          eventType: LambdaEdgeEventType.ORIGIN_RESPONSE,
          functionVersion: this.imageOriginResponseLambda.currentVersion,
        },
        {
          eventType: LambdaEdgeEventType.VIEWER_REQUEST,
          functionVersion: this.imageViewerRequestLambda.currentVersion,
        },
      ],
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      compress: true,
      trustedKeyGroups: signedUrlKeyGroups,
      ...cloudfrontDistributionProps?.defaultBehavior,
    };

    // Cloudfront distribution for the S3 bucket.
    this.distribution = createDistribution
      ? new Distribution(this, 'Distribution', {
          ...cloudfrontDistributionProps,
          defaultBehavior: this.behaviorOptions,
        })
      : undefined;
  }
}
