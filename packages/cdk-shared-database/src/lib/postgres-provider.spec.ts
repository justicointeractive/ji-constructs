import { Client } from 'pg';
import { Credentials } from '../lib/types';
import { createDatabase, deleteDatabase } from './postgres-provider';

describe('pg provider', () => {
  it('should create and drop db', async () => {
    const client = new Client();
    await client.connect();
    const credentials: Credentials = {
      username: `testuser${Math.floor(Math.random() * 100000)}`,
      password: `password${Math.floor(Math.random() * 100000)}`,
    };
    await createDatabase(client, credentials);
    await deleteDatabase(client, credentials);
  });
});
