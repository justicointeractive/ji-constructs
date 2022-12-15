import { Client } from 'pg';
import { Credentials, EventProps } from './types';

export const postgresProvider = {
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
    await createDatabase(client, instanceConnectionObject);
  },
  async delete(props: EventProps) {
    const { instanceConnectionObject } = props;
    const client = await this.connect(props);
    await deleteDatabase(client, instanceConnectionObject);
  },
};

export async function createDatabase(client: Client, credentials: Credentials) {
  const query = /* sql */ `
    create database ${credentials.username};
    create user ${credentials.username} with encrypted password '${credentials.password}';
    grant all privileges on database ${credentials.username} to ${credentials.username};
  `;
  await executeStatements(client, query);
}

export async function deleteDatabase(client: Client, credentials: Credentials) {
  const query = `
    drop database if exists ${credentials.username};
    drop user if exists ${credentials.username};
  `;
  await executeStatements(client, query);
}

async function executeStatements(client: Client, query: string) {
  for (const statement of query
    .trim()
    .split('\n')
    .map((statement) => statement.trim())) {
    await client.query(statement);
  }
}
