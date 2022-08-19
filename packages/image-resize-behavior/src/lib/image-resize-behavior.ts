import { Duration } from 'aws-cdk-lib';
import {
  BehaviorOptions,
  CachePolicy,
  CacheQueryStringBehavior,
  Distribution,
  DistributionProps,
  LambdaEdgeEventType,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin, S3OriginProps } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Function as Lambda, Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, BucketProps } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';
import { ImageResizeInventory } from './image-resize-inventory';

export type ImageResizeBehaviorProps = {
  createDistribution?: boolean;
  s3BucketOrProps?: Bucket | BucketProps;
  s3OriginProps?: Partial<S3OriginProps>;
  s3KeyPrefix?: string;
  originResponseLambdaProps?: NodejsFunctionProps;
  viewerRequestLambdaProps?: NodejsFunctionProps;
  cloudfrontDistributionProps?: DistributionProps;
  embedRootDir?: string;
};

export class ImageResizeBehavior extends Construct {
  imagesBucket: Bucket;
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
    } = props;

    this.imageResizeInventory = new ImageResizeInventory(this, 'Inventory');

    this.imagesBucket =
      s3BucketOrProps instanceof Bucket
        ? s3BucketOrProps
        : new Bucket(this, 'Bucket', s3BucketOrProps);

    const originResponseCodeRoot = path.resolve(
      `${embedRootDir}/packages/lambdas/image-resize-origin-response-function`
    );
    this.imageOriginResponseLambda = new NodejsFunction(
      this,
      'OriginResponseFunction',
      {
        bundling: {
          minify: true,
          nodeModules: ['sharp', '@aws-sdk/client-s3', '@aws-sdk/lib-dynamodb'],
          commandHooks: {
            beforeInstall: () => [],
            beforeBundling: () => [],
            afterBundling: () => [`rm package.json package-lock.json`],
          },
        },
        projectRoot: originResponseCodeRoot,
        depsLockFilePath: `${originResponseCodeRoot}/package-lock.json`,
        entry: `${originResponseCodeRoot}/src/index.js`,
        handler: 'handler',
        timeout: Duration.seconds(15),
        runtime: Runtime.NODEJS_16_X,
        memorySize: 1024,
        ...originResponseLambdaProps,
      }
    );

    this.imagesBucket.grantRead(this.imageOriginResponseLambda);
    this.imagesBucket.grantPut(this.imageOriginResponseLambda);
    this.imageResizeInventory.derrivedImagesTable.grantWriteData(
      this.imageOriginResponseLambda
    );

    const viewerRequestCodeRoot = path.resolve(
      `${embedRootDir}/packages/lambdas/image-resize-viewer-request-function`
    );
    this.imageViewerRequestLambda = new NodejsFunction(
      this,
      'ViewerRequestFunction',
      {
        bundling: {
          minify: true,
          nodeModules: [],
          commandHooks: {
            beforeInstall: () => [],
            beforeBundling: () => [],
            afterBundling: () => [`rm package.json package-lock.json`],
          },
        },
        projectRoot: viewerRequestCodeRoot,
        depsLockFilePath: `${viewerRequestCodeRoot}/package-lock.json`,
        entry: `${viewerRequestCodeRoot}/src/index.js`,
        handler: 'handler',
        runtime: Runtime.NODEJS_16_X,
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
    this.imagesBucket.grantRead(originAccessIdentity);

    this.behaviorOptions = {
      origin: new S3Origin(this.imagesBucket, {
        ...s3OriginProps,
        originAccessIdentity,
        customHeaders: {
          ...s3OriginProps?.customHeaders,
          'x-image-resize-inventory-table-name':
            this.imageResizeInventory.derrivedImagesTable.tableName,
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
