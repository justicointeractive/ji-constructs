import assert = require('assert');
import { Duration } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, Port } from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  DatabaseCluster,
  DatabaseInstance,
  DatabaseSecret,
} from 'aws-cdk-lib/aws-rds';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export type SharedDatabaseDatabaseProps = {
  databaseInstanceName: string;
} & (
  | {
      sharedDatabase: DatabaseInstance | DatabaseCluster;
    }
  | {
      sharedDbSecret: ISecret;
      vpc: IVpc;
      securityGroups: ISecurityGroup[];
    }
);

export class SharedDatabaseDatabase extends Construct {
  databaseInstance: DatabaseSecret;

  constructor(
    scope: Construct,
    id: string,
    { databaseInstanceName, ...props }: SharedDatabaseDatabaseProps
  ) {
    super(scope, id);

    const databaseInstance = (this.databaseInstance = new DatabaseSecret(
      this,
      'InstanceSecret',
      {
        username: databaseInstanceName,
      }
    ));

    const secret =
      'sharedDbSecret' in props
        ? props.sharedDbSecret
        : props.sharedDatabase.secret;
    const securityGroups =
      'securityGroups' in props
        ? props.securityGroups
        : props.sharedDatabase.connections.securityGroups;
    const vpc = 'vpc' in props ? props.vpc : props.sharedDatabase.vpc;

    assert(secret, 'secret must be attached to database instance');

    const onEventHandler = new NodejsFunction(this, 'OnEvent', {
      environment: {
        SHARED_CONNECTION_JSON: secret.secretValue.toJSON(),
        INSTANCE_CONNECTION_JSON: databaseInstance.secretValue.toJSON(),
      },
      timeout: Duration.minutes(10),
      vpc,
      bundling: {
        externalModules: ['pg-native'],
      },
      allowPublicSubnet: true,
    });

    for (const securityGroup of securityGroups) {
      onEventHandler.connections.allowTo(securityGroup, Port.allTraffic());
    }

    const role = new Role(this, 'ProviderRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    secret.grantRead(role);

    new Provider(this, 'Provider', {
      onEventHandler,
      role,
    });
  }
}
