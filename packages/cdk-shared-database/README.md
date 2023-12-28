# cdk-shared-database

## Example

```typescript
import { SharedDatabaseDatabase } from 'cdk-shared-database';
// ...
const db = new SharedDatabaseDatabase(this, 'Db', {
  databaseInstanceName: `${appName}-${stageName}`,
  sharedDatabase: {
    defaultPort: Port.tcp(5432),
    instanceIdentifier: 'shareddb-1',
    secret: 'shared/shareddb-1',
    vpc,
    securityGroups: ['sg-abc123'],
  },
  removalPolicy: RemovalPolicy.RETAIN,
});
```

## Running unit tests

Run `nx test cdk-shared-database` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint cdk-shared-database` to execute the lint via [ESLint](https://eslint.org/).
