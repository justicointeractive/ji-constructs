# loadbalanced-ecs-service

## Example

```typescript
import {
  LoadBalancedService,
  LoadBalancedServiceListenerLookup,
} from '@ji-constructs/loadbalanced-ecs-service';

const lookup = new LoadBalancedServiceListenerLookup(
  this,
  'LBLookup',
  props.listener
);
const { vpc } = lookup;

const service = new LoadBalancedService(this, 'Service', {
  cluster: props.cluster,
  domainName: props.apiHostname,
  listener: lookup,
  targetGroupProps: {
    healthCheck: {
      path: '/api',
    },
  },
  serviceFactory: (scope, cluster) => {
    return new Ec2Service(scope, 'Service', {
      cluster,
      taskDefinition: caliobase.taskDefinition,
      circuitBreaker: {
        rollback: true,
      },
    });
  },
});
```

## Running unit tests

Run `nx test loadbalanced-ecs-service` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint loadbalanced-ecs-service` to execute the lint via [ESLint](https://eslint.org/).
