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
    await createDatabase(client, {
      sharedConnectionOptions: {},
      instanceConnectionOptions: credentials,
    });
    await deleteDatabase(client, {
      sharedConnectionOptions: {},
      instanceConnectionOptions: credentials,
    });
    await client.end();
  });

  it('should create new, then from template and then drop both dbs', async () => {
    const client = new Client();
    await client.connect();

    const credentials1: Credentials = {
      username: `testuser1${Math.floor(Math.random() * 100000)}`,
      password: `password${Math.floor(Math.random() * 100000)}`,
    };
    const credentials2: Credentials = {
      username: `testuser2${Math.floor(Math.random() * 100000)}`,
      password: `password${Math.floor(Math.random() * 100000)}`,
    };

    await createDatabase(client, {
      sharedConnectionOptions: {},
      instanceConnectionOptions: credentials1,
    });

    {
      const client1 = new Client({
        database: credentials1.username,
        user: credentials1.username,
        password: credentials1.password,
      });
      await client1.connect();
      await client1.query(`CREATE TABLE test (id int)`);
      await client1.query(`INSERT INTO test VALUES (1)`);
      await client1.end();
    }

    await createDatabase(client, {
      sharedConnectionOptions: {},
      instanceConnectionOptions: credentials2,
      templateDatabaseInstanceName: credentials1.username,
    });

    {
      const client2 = new Client({
        database: credentials2.username,
        user: credentials2.username,
        password: credentials2.password,
      });
      // verify test table exists on new db
      await client2.connect();
      const results = await client2.query(`SELECT * FROM test`);
      expect(results.rows).toEqual([{ id: 1 }]);
      await client2.end();
    }

    await deleteDatabase(client, {
      sharedConnectionOptions: {},
      instanceConnectionOptions: credentials2,
    });

    {
      const client1 = new Client({
        database: credentials1.username,
        user: credentials1.username,
        password: credentials1.password,
      });
      // verify test table exists on old db
      await client1.connect();
      const results = await client1.query(`SELECT * FROM test`);
      expect(results.rows).toEqual([{ id: 1 }]);
      await client1.end();
    }

    await deleteDatabase(client, {
      sharedConnectionOptions: {},
      instanceConnectionOptions: credentials1,
    });

    await client.end();
  });
});
