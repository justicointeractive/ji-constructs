import type { CdkCustomResourceHandler } from 'aws-lambda';
import { Lambda } from 'aws-sdk';
import { getSecrets } from './getSecrets';
import assert = require('assert');

// invoked outside of VPC which can access secrets manager but not the db cluster
export const handler: CdkCustomResourceHandler = async (event) => {
  const secrets = await getSecrets(event.ResourceProperties as any);

  assert(
    secrets.instanceConnectionOptions.username ===
      event.ResourceProperties.databaseInstanceName
  );

  // invoke this lambda within VPC which can communicate with db
  const result = await new Lambda()
    .invoke({
      FunctionName: event.ResourceProperties.VPC_LAMBDA_ARN,
      Payload: JSON.stringify({
        ...event,
        ResourceProperties: {
          ...event.ResourceProperties,
          ...secrets,
        },
      }),
    })
    .promise();

  if (result.FunctionError) {
    throw new Error(result.FunctionError);
  }

  const resultJson = result.Payload?.toString();

  assert(resultJson);

  return JSON.parse(resultJson);
};
