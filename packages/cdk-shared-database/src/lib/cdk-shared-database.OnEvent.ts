import type {
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from 'aws-lambda';
import { Lambda, SecretsManager } from 'aws-sdk';
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

// invoked outside of VPC which can access secrets manager but not the db cluster
export const handler: CdkCustomResourceHandler = async (event) => {
  const props: EventProps = await getSecrets(event.ResourceProperties as any);

  const result = await new Lambda()
    .invoke({
      FunctionName: event.ResourceProperties.VPC_LAMBDA_ARN,
      Payload: {
        ...event,
        ResourceProperties: {
          connections: props,
        },
      },
    })
    .promise();

  const resultJson = result.Payload?.toString();

  assert(resultJson);

  console.log({ resultJson });

  return JSON.parse(resultJson);
};

// invoked within VPC which can access the db cluster but not secrets manager
export const vpcHandler: CdkCustomResourceHandler = async (event) => {
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
    console.log(
      `connecting to pg '${sharedConnectionObject.host}:${sharedConnectionObject.port}`
    );
    await client.connect();
    console.log(
      `connected to pg '${sharedConnectionObject.host}:${sharedConnectionObject.port}`
    );
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
