import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ImageResizeInventory } from '@ji-constructs/image-resize-inventory';
import { ScheduledHandler } from 'aws-lambda';
import { addDays, parseISO } from 'date-fns';
import { pick } from 'lodash';

import assert = require('assert');

const dynamodb = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: 'us-east-1',
  })
);

const s3 = new S3Client({
  region: 'us-east-1',
});

const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME;
const s3BucketName = process.env.S3_BUCKET_NAME;
assert(dynamodbTableName);
const inventoryClient = new ImageResizeInventory({
  tableName: dynamodbTableName,
});

export const handler: ScheduledHandler = async ({ time }) => {
  const expireds = await inventoryClient.listKeysExpiredBefore(
    addDays(parseISO(time), -7)
  );

  for (const expired of expireds ?? []) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: s3BucketName,
        Key: expired.Key,
      })
    );
    await dynamodb.send(
      new DeleteCommand({
        TableName: dynamodbTableName,
        Key: pick(expired, ['Key', 'BaseKey']),
      })
    );
  }
};
