import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { startLocalstackDocker } from '@ji-constructs/start-localstack-docker';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { updateInventory } from './updateInventory';

describe('updateInventory', () => {
  let shutdownLocalStack: (() => void) | null;
  let dynamodbClient: DynamoDBClient;

  beforeAll(async () => {
    shutdownLocalStack = await startLocalstackDocker({
      services: ['dynamodb'],
      edgePort: 6546,
    });
    dynamodbClient = new DynamoDBClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
      endpoint: 'http://localhost.localstack.cloud:6546',
    });
    await dynamodbClient.send(
      new CreateTableCommand({
        TableName: 'testTable',
        KeySchema: [
          { AttributeName: 'BaseKey', KeyType: 'HASH' },
          { AttributeName: 'Key', KeyType: 'RANGE' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'BaseKey', AttributeType: AttributeType.STRING },
          { AttributeName: 'Key', AttributeType: AttributeType.STRING },
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
      })
    );
  });
  afterAll(async () => {
    shutdownLocalStack?.();
  });

  it('should update inventory', async () => {
    const documentClient = DynamoDBDocumentClient.from(dynamodbClient);
    await updateInventory(
      'testTable',
      'testPrefix/',
      {
        requestedKey: 'test/123.png;width=100;.avif',
        baseKey: 'test/123.png',
        params: {
          width: '100',
          format: 'avif',
        },
      },
      documentClient
    );
    expect(
      await documentClient.send(
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
});
