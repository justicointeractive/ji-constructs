import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { LambdaNpmFunction } from 'cdk-lambda-npm-function';
import { Construct } from 'constructs';
import { resolve } from 'path';

export class ImageResizeInventory extends Construct {
  derrivedImagesTable: Table;

  constructor(
    scope: Construct,
    id: string,
    props: {
      embedRootDir: string;
      bucket: IBucket;
    }
  ) {
    super(scope, id);

    const { embedRootDir } = props;

    this.derrivedImagesTable = new Table(this, 'BaseKeyKeyInventoryTable', {
      partitionKey: { name: 'BaseKey', type: AttributeType.STRING },
      sortKey: { name: 'Key', type: AttributeType.STRING },
    });

    const fn = new LambdaNpmFunction(this, 'TidyFn', {
      projectRoot: resolve(
        embedRootDir,
        'packages/lambdas/image-resize-tidy-function'
      ),
      environment: {
        DYNAMODB_TABLE_NAME: this.derrivedImagesTable.tableName,
        S3_BUCKET_NAME: props.bucket.bucketName,
      },
    });

    const eventRule = new Rule(this, 'Schedule', {
      schedule: Schedule.cron({
        minute: '0',
      }),
    });

    eventRule.addTarget(new LambdaFunction(fn));
  }
}
