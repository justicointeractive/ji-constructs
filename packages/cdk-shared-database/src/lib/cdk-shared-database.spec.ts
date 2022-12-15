import { Template } from 'aws-cdk-lib/assertions';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
} from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { App, Stack } from 'aws-cdk-lib/core';
import { SharedDatabaseDatabase } from './cdk-shared-database';

describe('cdkSharedDatabase', () => {
  it('should work with a created db instance', () => {
    const app = new App();

    const stack = new Stack(app, 'TestStack');

    const sharedDatabase = new DatabaseInstance(stack, 'SharedDb', {
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_14_2,
      }),
      vpc: new Vpc(stack, 'Vpc'),
    });

    new SharedDatabaseDatabase(stack, 'InstanceDb', {
      sharedDatabase,
      databaseInstanceName: 'instancedb',
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SecretsManager::Secret', 2);
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.resourceCountIs('Custom::SharedDatabaseDatabase', 1);
  });

  it('should work with a referenced db instance', () => {
    const app = new App();

    const stack = new Stack(app, 'TestStack');

    new SharedDatabaseDatabase(stack, 'InstanceDb', {
      databaseInstanceName: 'instancedb',
      sharedDatabase: {
        instanceIdentifier: 'abc-123',
        secret: Secret.fromSecretNameV2(
          stack,
          'SharedDbSecret',
          'shareddb/secret-123'
        ),
        securityGroups: [
          SecurityGroup.fromSecurityGroupId(stack, 'SecurityGroup', 'sg-123'),
        ],
        vpc: Vpc.fromVpcAttributes(stack, 'Vpc', {
          availabilityZones: ['us-abc-123'],
          publicSubnetIds: ['subnet-123'],
          privateSubnetIds: ['subnet-234'],
          vpcId: 'vpc-123',
        }),
      },
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    template.resourceCountIs('AWS::RDS::DBInstance', 0);
    template.resourceCountIs('Custom::SharedDatabaseDatabase', 1);
  });
});
