import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: 'us-east-1',
  })
);

export async function updateInventory(
  inventoryTableName: string,
  s3KeyPrefix: string,
  params: {
    requestedKey: string;
    baseName: string;
    params: Record<string, string>;
    extension: string;
  },
  client = dynamodb
) {
  await client.send(
    new UpdateCommand({
      TableName: inventoryTableName,
      Key: { Key: s3KeyPrefix + params.requestedKey },
      AttributeUpdates: {
        LastRetrievedFromOrigin: { Value: new Date().toISOString() },
        BaseKey: {
          Value: s3KeyPrefix + params.baseName + '.' + params.extension,
        },
      },
    })
  );
}
