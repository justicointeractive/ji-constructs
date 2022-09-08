import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

export class ImageResizeInventory {
  ddbDocumentClient: DynamoDBDocumentClient;
  s3: S3Client;
  tableName: string;

  constructor(options: {
    tableName: string;
    dynamodb?: DynamoDBClient;
    s3?: S3Client;
  }) {
    this.tableName = options.tableName;
    this.ddbDocumentClient = DynamoDBDocumentClient.from(
      options.dynamodb ??
        new DynamoDBClient({
          region: 'us-east-1',
        })
    );
    this.s3 =
      options.s3 ??
      new S3Client({
        region: 'us-east-1',
      });
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
}
