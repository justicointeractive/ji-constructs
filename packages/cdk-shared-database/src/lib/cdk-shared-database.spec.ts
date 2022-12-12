import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
} from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
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
  });

  it('should work with a referenced db instance', () => {
    const app = new App();

    const stack = new Stack(app, 'TestStack');

    const secret = Secret.fromSecretNameV2(
      stack,
      'SharedDbSecret',
      'shareddb/secret'
    );

    const vpc = Vpc.fromVpcAttributes(stack, 'Vpc', {
      availabilityZones: ['us-abc-123'],
      publicSubnetIds: ['subnet-123'],
      vpcId: 'vpc-123',
    });

    const securityGroups = [
      SecurityGroup.fromSecurityGroupId(stack, 'SecurityGroup', 'sg-123'),
    ];

    new SharedDatabaseDatabase(stack, 'InstanceDb', {
      databaseInstanceName: 'instancedb',
      sharedDbSecret: secret,
      securityGroups,
      vpc,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    template.resourceCountIs('AWS::RDS::DBInstance', 0);
  });
});
