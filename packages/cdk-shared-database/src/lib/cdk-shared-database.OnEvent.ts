import type {
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from 'aws-lambda';
import { SecretsManager } from 'aws-sdk';
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

const secrets = (async () => {
  const { SHARED_CONNECTION_SECRET_ARN, INSTANCE_CONNECTION_SECRET_ARN } =
    process.env;
  const secrets = new SecretsManager();

  assert(SHARED_CONNECTION_SECRET_ARN);
  assert(INSTANCE_CONNECTION_SECRET_ARN);

  const sharedConnectionSecret = await secrets
    .getSecretValue({
      SecretId: SHARED_CONNECTION_SECRET_ARN,
    })
    .promise();
  const instanceConnectionSecret = await secrets
    .getSecretValue({
      SecretId: INSTANCE_CONNECTION_SECRET_ARN,
    })
    .promise();

  const sharedConnectionJson = sharedConnectionSecret.SecretString;
  const instanceConnectionJson = instanceConnectionSecret.SecretString;

  assert(sharedConnectionJson);
  assert(instanceConnectionJson);

  const sharedConnectionObject = JSON.parse(
    sharedConnectionJson
  ) as DatabaseSecretValue;

  const instanceConnectionObject = JSON.parse(
    instanceConnectionJson
  ) as DatabaseSecretValue;

  const props: EventProps = {
    sharedConnectionObject,
    instanceConnectionObject,
  };

  return props;
})();

export const handler: CdkCustomResourceHandler = async (event) => {
  const props = await secrets;

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
