import type {
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from 'aws-lambda';
import { postgresProvider } from './postgres-provider';
import { EventProps } from './types';
import assert = require('assert');

// invoked within VPC which can access the db cluster but not secrets manager
export const handler: CdkCustomResourceHandler = async (event) => {
  const props = event.ResourceProperties as unknown as EventProps;

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
  const provider = providers[props.sharedConnectionOptions.engine];
  assert(
    provider,
    `Engine '${props.instanceConnectionOptions.engine}' is not implemented`
  );
  await provider.create(props);
  return {
    PhysicalResourceId: props.databaseInstanceName,
  };
}

async function onDelete(props: EventProps): Promise<CdkCustomResourceResponse> {
  const provider = providers[props.sharedConnectionOptions.engine];
  assert(
    provider,
    `Engine '${props.instanceConnectionOptions.engine}' is not implemented`
  );
  await provider.delete(props);
  return {
    PhysicalResourceId: props.databaseInstanceName,
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
