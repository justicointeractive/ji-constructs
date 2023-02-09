import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { startLocalstackDocker } from '@ji-constructs/start-localstack-docker';
import { ImageResizeInventory } from './image-resize-inventory';

describe('updateInventory', () => {
  let shutdownLocalStack: (() => void) | null;
  let instance: ImageResizeInventory;

  beforeAll(async () => {
    shutdownLocalStack = await startLocalstackDocker({
      services: ['dynamodb'],
      edgePort: 6546,
    });
    const s3 = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
      endpoint: 'http://localhost.localstack.cloud:6546',
    });
    const dynamodb = new DynamoDBClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
      endpoint: 'http://localhost.localstack.cloud:6546',
    });

    instance = new ImageResizeInventory({
      tableName: 'testTable',
      s3,
      dynamodb,
      s3Bucket: 'test-bucket',
    });

    await dynamodb.send(
      new CreateTableCommand({
        TableName: 'testTable',
        KeySchema: [
          { AttributeName: 'BaseKey', KeyType: 'HASH' },
          { AttributeName: 'Key', KeyType: 'RANGE' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'BaseKey', AttributeType: 'S' },
          { AttributeName: 'Key', AttributeType: 'S' },
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
      })
    );
  });
  afterAll(async () => {
    shutdownLocalStack?.();
  });

  it('should update inventory', async () => {
    await instance.updateKeyMetadata('testPrefix/', {
      requestedKey: 'test/123.png;width=100;.avif',
      baseKey: 'test/123.png',
      params: {
        width: '100',
        format: 'avif',
      },
    });
    expect(
      await instance.ddbDocumentClient.send(
        new GetCommand({
          TableName: 'testTable',
          Key: {
            BaseKey: 'testPrefix/test/123.png',
            Key: 'testPrefix/test/123.png;width=100;.avif',
          },
        })
      )
    ).toMatchObject({ Item: { BaseKey: 'testPrefix/test/123.png' } });
    await instance.updateKeyMetadata('testPrefix/', {
      requestedKey: 'test/123.png;width=100;.avif',
      baseKey: 'test/123.png',
      params: {
        width: '100',
        format: 'avif',
      },
    });
    expect(
      await instance.ddbDocumentClient.send(
        new GetCommand({
          TableName: 'testTable',
          Key: {
            BaseKey: 'testPrefix/test/123.png',
            Key: 'testPrefix/test/123.png;width=100;.avif',
          },
        })
      )
    ).toMatchObject({ Item: { BaseKey: 'testPrefix/test/123.png' } });
  });

  it('should list an item', async () => {
    expect(await instance.listKeysExpiredBefore(new Date())).toHaveLength(1);
  });
});
