import type {
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from 'aws-lambda';
import { postgresProvider } from './postgres-provider';
import { EventProps } from './types';
import assert = require('assert');

// invoked within VPC which can access the db cluster but not secrets manager
export const handler: CdkCustomResourceHandler = async (event) => {
  const props: EventProps = event.ResourceProperties.connections;

  switch (event.RequestType) {
    case 'Create':
      return onCreate(props);
    case 'Update':
      return onCreate(props);
    case 'Delete':
      return onDelete(props);
  }
};

async function onCreate(props: EventProps): Promise<CdkCustomResourceResponse> {
  const provider = providers[props.sharedConnectionObject.engine];
  assert(
    provider,
    `Engine '${props.instanceConnectionObject.engine}' is not implemented`
  );
  await provider.create(props);
  return {
    PhysicalResourceId: props.instanceConnectionObject.username,
  };
}

async function onDelete(props: EventProps): Promise<CdkCustomResourceResponse> {
  const provider = providers[props.sharedConnectionObject.engine];
  assert(
    provider,
    `Engine '${props.instanceConnectionObject.engine}' is not implemented`
  );
  await provider.delete(props);
  return {
    PhysicalResourceId: props.instanceConnectionObject.username,
  };
}

const providers: Record<
  string,
  | {
      create: (props: EventProps) => Promise<void>;
      delete: (props: EventProps) => Promise<void>;
    }
  | undefined
> = {
  postgres: postgresProvider,
};
