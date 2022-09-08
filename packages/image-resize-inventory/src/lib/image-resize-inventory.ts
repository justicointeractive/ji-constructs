import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { pick } from 'lodash';

export class ImageResizeInventory {
  ddbDocumentClient: DynamoDBDocumentClient;
  s3: S3Client;
  tableName: string;
  s3Bucket: string;

  constructor(options: {
    tableName: string;
    s3Bucket: string;
    dynamodb: DynamoDBClient;
    s3: S3Client;
  }) {
    this.tableName = options.tableName;
    this.s3Bucket = options.s3Bucket;
    this.ddbDocumentClient = DynamoDBDocumentClient.from(options.dynamodb);
    this.s3 = options.s3;
  }

  async updateKeyMetadata(
    s3KeyPrefix: string,
    params: {
      requestedKey: string;
      baseKey: string;
      params: Record<string, string>;
    }
  ) {
    await this.ddbDocumentClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          BaseKey: s3KeyPrefix + params.baseKey,
          Key: s3KeyPrefix + params.requestedKey,
        },
        AttributeUpdates: {
          LastRetrievedFromOrigin: { Value: new Date().toISOString() },
        },
      })
    );
  }

  async listKeysExpiredBefore(time: Date) {
    const response = await this.ddbDocumentClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: `LastRetrievedFromOrigin < :epoch`,
        ExpressionAttributeValues: {
          ':epoch': time.toISOString(),
        },
      })
    );
    const { Items: expireds } = response;
    return expireds;
  }

  async deleteExpired(expired: Record<string, any>) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.s3Bucket,
        Key: expired.Key,
      })
    );
    await this.ddbDocumentClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: pick(expired, ['Key', 'BaseKey']),
      })
    );
  }
}
