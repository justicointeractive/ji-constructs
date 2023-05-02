export type DatabaseSecretValue = {
  password: string;
  engine: string;
  port: number;
  dbInstanceIdentifier: string;
  host: string;
  username: string;
};

export type EventProps = {
  databaseInstanceName: string;
  templateDatabaseInstanceName?: string;
  instanceConnectionOptions: DatabaseSecretValue;
  sharedConnectionOptions: DatabaseSecretValue;
};

export type Credentials = {
  username?: string;
  password?: string;
};

export type DbEventProps = {
  instanceConnectionOptions: Credentials;
  sharedConnectionOptions: Credentials;
  templateDatabaseInstanceName?: string;
};
