import assert = require('assert');
import { CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, Port } from 'aws-cdk-lib/aws-ec2';
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

  removalPolicy?: RemovalPolicy.DESTROY | RemovalPolicy.RETAIN;

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

    const onEventHandlerVpc = new NodejsFunction(this, 'OnEventVpc', {
      timeout: Duration.minutes(1),
      vpc,
      bundling: {
        nodeModules: ['pg'],
      },
    });

    for (const securityGroup of securityGroups) {
      onEventHandlerVpc.connections.allowTo(securityGroup, Port.allTraffic());
    }

    const onEventHandler = new NodejsFunction(this, 'OnEvent', {
      timeout: Duration.minutes(1),
      bundling: {
        nodeModules: ['pg'],
      },
    });

    secret.grantRead(onEventHandler);
    databaseInstanceSecret.grantRead(onEventHandler);
    onEventHandlerVpc.grantInvoke(onEventHandler);

    const dbProvider = new Provider(this, 'Provider', {
      onEventHandler,
    });

    const dbResource = new CustomResource(this, 'Db', {
      serviceToken: dbProvider.serviceToken,
      resourceType: 'Custom::SharedDatabaseDatabase',
      removalPolicy: props.removalPolicy,
      properties: {
        SHARED_CONNECTION_SECRET_ARN: secret.secretArn,
        INSTANCE_CONNECTION_SECRET_ARN: databaseInstanceSecret.secretArn,
        VPC_LAMBDA_ARN: onEventHandlerVpc.functionArn,
        databaseInstanceName,
      },
    });

    dbResource.node.addDependency(secret, databaseInstanceSecret);
  }
}
