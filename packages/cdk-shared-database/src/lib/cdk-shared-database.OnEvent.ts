import type { CdkCustomResourceHandler } from 'aws-lambda';
import { Lambda, SecretsManager } from 'aws-sdk';
import { DatabaseSecretValue, EventProps } from './types';
import assert = require('assert');

// invoked outside of VPC which can access secrets manager but not the db cluster
export const handler: CdkCustomResourceHandler = async (event) => {
  console.log(event);

  const props: EventProps = await getSecrets(event.ResourceProperties as any);

  const result = await new Lambda()
    .invoke({
      FunctionName: event.ResourceProperties.VPC_LAMBDA_ARN,
      Payload: JSON.stringify({
        ...event,
        ResourceProperties: {
          ...event.ResourceProperties,
          connections: props,
        },
      }),
    })
    .promise();

  const resultJson = result.Payload?.toString();

  assert(resultJson);

  console.log({ resultJson });

  return JSON.parse(resultJson);
};

async function getSecrets({
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

  const props: EventProps = {
    sharedConnectionObject,
    instanceConnectionObject,
  };
  return props;
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
