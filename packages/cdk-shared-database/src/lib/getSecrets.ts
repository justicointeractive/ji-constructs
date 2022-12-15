import { SecretsManager } from 'aws-sdk';
import { DatabaseSecretValue } from './types';
import assert = require('assert');

export async function getSecrets({
  SHARED_CONNECTION_SECRET_ARN: sharedConnectionSecretArn,
  INSTANCE_CONNECTION_SECRET_ARN: instanceConnectionSecretArn,
}: {
  SHARED_CONNECTION_SECRET_ARN: string;
  INSTANCE_CONNECTION_SECRET_ARN: string;
}) {
  const sharedConnectionObject = await getSecretAsJson(
    sharedConnectionSecretArn
  );

  const instanceConnectionObject = await getSecretAsJson(
    instanceConnectionSecretArn
  );

  return {
    sharedConnectionObject,
    instanceConnectionObject,
  };
}

async function getSecretAsJson(secretArn: string) {
  const secrets = new SecretsManager();

  assert(secretArn);

  console.log(`retrieving secret '${secretArn}'`);

  const secretResponse = await secrets
    .getSecretValue({
      SecretId: secretArn,
    })
    .promise();

  const secretString = secretResponse.SecretString;

  console.log(`retrieved secret '${secretArn}'`);

  assert(secretString);

  const secretJsonObject = JSON.parse(secretString) as DatabaseSecretValue;

  return secretJsonObject;
}
