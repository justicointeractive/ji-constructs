import type { CdkCustomResourceHandler } from 'aws-lambda';
import { Lambda } from 'aws-sdk';
import { getSecrets } from './getSecrets';
import { EventProps } from './types';
import assert = require('assert');

// invoked outside of VPC which can access secrets manager but not the db cluster
export const handler: CdkCustomResourceHandler = async (event) => {
  const props: EventProps = await getSecrets(event.ResourceProperties as any);

  // invoke this lambda within VPC which can communicate with db
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

  return JSON.parse(resultJson);
};
