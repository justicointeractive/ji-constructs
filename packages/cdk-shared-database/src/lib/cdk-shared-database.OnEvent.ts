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
  const props: EventProps = await getSecrets(event.ResourceProperties as any);

  switch (event.RequestType) {
    case 'Create':
      return onCreate(props);
    case 'Update':
      return onCreate(props);
    case 'Delete':
      return onDelete(props);
  }
};

async function getSecrets({
  SHARED_CONNECTION_JSON: sharedConnectionJson,
  INSTANCE_CONNECTION_JSON: instanceConnectionJson,
}: {
  SHARED_CONNECTION_JSON: string;
  INSTANCE_CONNECTION_JSON: string;
}) {
  const sharedConnectionObject = await getSecretAsJson(sharedConnectionJson);

  const instanceConnectionObject = await getSecretAsJson(
    instanceConnectionJson
  );

  const props: EventProps = {
    sharedConnectionObject,
    instanceConnectionObject,
  };
  return props;
}

async function getSecretAsJson(secretString: string) {
  const secretJsonObject = JSON.parse(secretString) as DatabaseSecretValue;
  return secretJsonObject;
}

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

const postgresProvider = {
  async connect(props: EventProps) {
    const { sharedConnectionObject } = props;
    const pg = await import('pg');
    const client = new pg.Client({
      ...sharedConnectionObject,
      user: sharedConnectionObject.username,
    });
    await client.connect();
    return client;
  },
  async create(props: EventProps) {
    const { instanceConnectionObject } = props;
    const client = await this.connect(props);
    await client.query(`
        create database ${instanceConnectionObject.username};
        create user ${instanceConnectionObject.username} with encrypted password '${instanceConnectionObject.password}';
        grant all privileges on database ${instanceConnectionObject.username} to ${instanceConnectionObject.username};
      `);
  },
  async delete(props: EventProps) {
    const { instanceConnectionObject } = props;
    const client = await this.connect(props);
    await client.query(`
        drop database if exists ${instanceConnectionObject.username};
        drop user if exists ${instanceConnectionObject.username};
      `);
  },
};

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
