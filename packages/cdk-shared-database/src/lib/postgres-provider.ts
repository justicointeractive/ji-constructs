import { Client } from 'pg';
import { DbEventProps, EventProps } from './types';

const sql = String.raw;

export const postgresProvider = {
  async connect(props: EventProps) {
    const { sharedConnectionOptions } = props;
    const pg = await import('pg');
    const client = new pg.Client({
      ...sharedConnectionOptions,
      user: sharedConnectionOptions.username,
    });
    console.log(
      `connecting to pg '${sharedConnectionOptions.host}:${sharedConnectionOptions.port}`
    );
    await client.connect();
    console.log(
      `connected to pg '${sharedConnectionOptions.host}:${sharedConnectionOptions.port}`
    );
    return client;
  },
  async create(props: EventProps) {
    const client = await this.connect(props);
    await createDatabase(client, props);
  },
  async delete(props: EventProps) {
    const client = await this.connect(props);
    await deleteDatabase(client, props);
  },
};

export async function createDatabase(client: Client, props: DbEventProps) {
  const {
    sharedConnectionOptions: sharedCredentials,
    instanceConnectionOptions: credentials,
    templateDatabaseInstanceName,
  } = props;

  const statements: string[] = [];
  const finallyStatements: string[] = [];

  if (templateDatabaseInstanceName) {
    // in order to use template database, we need to disconnect all users
    statements.push(
      sql`ALTER DATABASE "${templateDatabaseInstanceName}" allow_connections false;`,
      sql`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${templateDatabaseInstanceName}' AND pid <> pg_backend_pid();`,
      sql`CREATE DATABASE "${credentials.username}" WITH TEMPLATE "${templateDatabaseInstanceName}";`
    );
    finallyStatements.push(
      sql`ALTER DATABASE "${templateDatabaseInstanceName}" allow_connections true;`
    );
  } else {
    statements.push(sql`CREATE DATABASE "${credentials.username}";`);
  }

  statements.push(
    sql`CREATE USER "${credentials.username}" WITH ENCRYPTED PASSWORD '${credentials.password}';`,
    sql`GRANT ALL PRIVILEGES ON DATABASE "${credentials.username}" TO "${credentials.username}";`
  );

  try {
    await executeStatements(client, statements);
  } finally {
    await executeStatements(client, finallyStatements);
  }

  if (templateDatabaseInstanceName) {
    const pg = await import('pg');

    const client2 = new pg.Client({
      ...sharedCredentials,
      user: sharedCredentials?.username,
      database: credentials.username,
    });

    await client2.connect();

    await executeStatements(client2, [
      sql`REASSIGN OWNED BY "${templateDatabaseInstanceName}" TO "${credentials.username}";`,
    ]);

    await client2.end();
  }
}

export async function deleteDatabase(client: Client, props: DbEventProps) {
  const { instanceConnectionOptions: credentials } = props;
  await executeStatements(client, [
    sql`DROP DATABASE IF EXISTS "${credentials.username}";`,
    sql`DROP USER IF EXISTS "${credentials.username}";`,
  ]);
}

async function executeStatements(client: Client, statements: string[]) {
  for (const statement of statements) {
    await client.query(statement);
  }
}
