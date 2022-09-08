import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { RegionInputConfig } from '@aws-sdk/config-resolver';
import { ImageResizeInventory } from '@ji-constructs/image-resize-inventory';
import { ScheduledHandler } from 'aws-lambda';
import { addDays, parseISO } from 'date-fns';

import assert = require('assert');

const regionConfig: RegionInputConfig = {
  region: 'us-east-1',
};

const dynamodb = new DynamoDBClient(regionConfig);

const s3 = new S3Client(regionConfig);

const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME;
const s3BucketName = process.env.S3_BUCKET_NAME;

assert(dynamodbTableName);
assert(s3BucketName);

const inventoryClient = new ImageResizeInventory({
  tableName: dynamodbTableName,
  s3Bucket: s3BucketName,
  s3,
  dynamodb,
});

export const handler: ScheduledHandler = async ({ time }) => {
  const expireds = await inventoryClient.listKeysExpiredBefore(
    addDays(parseISO(time), -7)
  );

  for (const expired of expireds ?? []) {
    await inventoryClient.deleteExpired(expired);
  }
};
