import assert = require('assert');
import { Duration } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, Port } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  DatabaseCluster,
  DatabaseInstance,
  DatabaseSecret,
} from 'aws-cdk-lib/aws-rds';
import {
  AttachmentTargetType,
  ISecret,
  SecretAttachmentTargetProps,
} from 'aws-cdk-lib/aws-secretsmanager';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export type SharedDatabaseDatabaseProps = {
  databaseInstanceName: string;

  sharedDatabase:
    | DatabaseInstance
    | DatabaseCluster
    | ({
        secret: ISecret;
        vpc: IVpc;
        securityGroups: ISecurityGroup[];
      } & (
        | { instanceIdentifier: string }
        | {
            clusterIdentifier: string;
          }
      ));
};

export class SharedDatabaseDatabase extends Construct {
  databaseInstanceSecret: DatabaseSecret;

  constructor(
    scope: Construct,
    id: string,
    { databaseInstanceName, ...props }: SharedDatabaseDatabaseProps
  ) {
    super(scope, id);

    const databaseInstanceSecret = (this.databaseInstanceSecret =
      new DatabaseSecret(this, 'InstanceSecret', {
        username: databaseInstanceName,
      }));

    const {
      sharedDatabase: { secret, vpc, ...sharedDatabase },
    } = props;
    const securityGroups =
      'securityGroups' in sharedDatabase
        ? sharedDatabase.securityGroups
        : sharedDatabase.connections.securityGroups;

    assert(secret, 'secret must be attached to database instance');

    const secretTarget: SecretAttachmentTargetProps | null =
      'instanceIdentifier' in sharedDatabase
        ? {
            targetType: AttachmentTargetType.RDS_DB_INSTANCE,
            targetId: sharedDatabase.instanceIdentifier,
          }
        : 'clusterIdentifier' in sharedDatabase
        ? {
            targetType: AttachmentTargetType.RDS_DB_CLUSTER,
            targetId: sharedDatabase.clusterIdentifier,
          }
        : null;

    if (secretTarget) {
      databaseInstanceSecret.attach({
        asSecretAttachmentTarget: () => secretTarget,
      });
    }

    const onEventHandler = new NodejsFunction(this, 'OnEvent', {
      environment: {
        SHARED_CONNECTION_JSON: secret.secretValue.toJSON(),
        INSTANCE_CONNECTION_JSON: databaseInstanceSecret.secretValue.toJSON(),
      },
      timeout: Duration.minutes(10),
      vpc,
      bundling: {
        nodeModules: ['pg'],
      },
      allowPublicSubnet: true,
    });

    for (const securityGroup of securityGroups) {
      onEventHandler.connections.allowTo(securityGroup, Port.allTraffic());
    }

    const role = new Role(this, 'ProviderRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    secret.grantRead(role);

    new Provider(this, 'Provider', {
      onEventHandler,
      role,
    });
  }
}
