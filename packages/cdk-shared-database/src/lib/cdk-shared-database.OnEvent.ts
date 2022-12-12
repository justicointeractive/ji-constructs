import type {
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from 'aws-lambda';
import assert = require('assert');

type DatabaseSecretValue = {
  password: string;
  engine: string;
  port: number;
  dbInstanceIdentifier: string;
  host: string;
  username: string;
};

type EventProps = {
  sharedConnectionObject: DatabaseSecretValue;
  instanceConnectionObject: DatabaseSecretValue;
};

export const handler: CdkCustomResourceHandler = async (event) => {
  const { SHARED_CONNECTION_JSON, INSTANCE_CONNECTION_JSON } = process.env;

  assert(SHARED_CONNECTION_JSON);
  assert(INSTANCE_CONNECTION_JSON);

  const sharedConnectionObject = JSON.parse(
    SHARED_CONNECTION_JSON
  ) as DatabaseSecretValue;
  const instanceConnectionObject = JSON.parse(
    INSTANCE_CONNECTION_JSON
  ) as DatabaseSecretValue;

  const props: EventProps = {
    sharedConnectionObject,
    instanceConnectionObject,
  };

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
    PhysicalResourceId: props.sharedConnectionObject.username,
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
    PhysicalResourceId: props.sharedConnectionObject.username,
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
  postgres: {
    create: async (props) => {
      const { sharedConnectionObject, instanceConnectionObject } = props;
      const pg = await import('pg');
      const client = new pg.Client({
        ...sharedConnectionObject,
        user: sharedConnectionObject.username,
      });
      await client.connect();
      await client.query(`
        create database ${instanceConnectionObject.username};
        create user ${instanceConnectionObject.username} with encrypted password '${instanceConnectionObject.password}';
        grant all privileges on database ${instanceConnectionObject.username} to ${instanceConnectionObject.username};
      `);
    },
    delete: async (props) => {
      const { sharedConnectionObject, instanceConnectionObject } = props;
      const pg = await import('pg');
      const client = new pg.Client({
        ...sharedConnectionObject,
        user: sharedConnectionObject.username,
      });
      await client.connect();
      await client.query(`
        drop database if exists ${instanceConnectionObject.username};
        drop user if exists ${instanceConnectionObject.username};
      `);
    },
  },
};
