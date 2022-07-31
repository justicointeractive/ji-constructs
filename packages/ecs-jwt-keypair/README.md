# ecs-jwt-keypair

This is an [AWS CDK](https://aws.amazon.com/cdk/) L3 Construct for creating PEM format keypairs in [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) which can be used for RS256 JWT signing/verification.

## Usage in Stack

```typescript
class MyStack extends Construct {
  constructor() {
    const jwtKeys = new EcsJwtKeyPair(this, 'JwtKeys');

    const apiContainer = taskDefinition.addContainer('api', {
      secrets: {
        JWT_PRIVATE_KEY: jwtKeys.ecsSecrets.privateKey,
        JWT_PUBLIC_KEY: jwtKeys.ecsSecrets.publicKey,
      },
    });
  }
}
```

## Usage in Application

```typescript
import { sign as signToken } from 'jsonwebtoken';

const { JWT_PRIVATE_KEY } = process.env;

signToken({ sub: 'abc123' }, JWT_PRIVATE_KEY, { algorithm: 'RS256' });
```

```typescript
import { verify as verifyToken } from 'jsonwebtoken';

const { JWT_PUBLIC_KEY } = process.env;

verifyToken(token, JWT_PUBLIC_KEY, { algorithms: ['RS256'] });
```

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test ecs-jwt-keypair` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ecs-jwt-keypair` to execute the lint via [ESLint](https://eslint.org/).
