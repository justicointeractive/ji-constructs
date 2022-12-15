export type DatabaseSecretValue = {
  password: string;
  engine: string;
  port: number;
  dbInstanceIdentifier: string;
  host: string;
  username: string;
};

export type EventProps = {
  sharedConnectionObject: DatabaseSecretValue;
  instanceConnectionObject: DatabaseSecretValue;
};

export type Credentials = {
  username: string;
  password: string;
};
