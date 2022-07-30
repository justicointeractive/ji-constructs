import { Stack } from 'aws-cdk-lib';
import { Secret as EcsSecret } from 'aws-cdk-lib/aws-ecs';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { KeyPair, PublicKeyFormat } from 'cdk-ec2-key-pair';
import { Construct } from 'constructs';

export class EcsJwtKeyPair extends Construct {
  keyPair: KeyPair;

  secrets: {
    privateKey: ISecret;
    publicKey: ISecret;
  };

  ecsSecrets: {
    privateKey: EcsSecret;
    publicKey: EcsSecret;
  };

  constructor(scope: Construct, id: string, props: { keyName?: string } = {}) {
    super(scope, id);

    const stackName = Stack.of(this).stackName;
    const resourcePrefix =
      stackName.length > 30
        ? stackName.slice(0, 15) + stackName.slice(-15)
        : stackName;
    this.keyPair = new KeyPair(this, 'KeyPair', {
      resourcePrefix,
      name: props.keyName ?? this.node.addr,
      storePublicKey: true,
      publicKeyFormat: PublicKeyFormat.PEM,
    });

    this.secrets = {
      privateKey: Secret.fromSecretCompleteArn(
        this,
        'JwtPrivateKey',
        this.keyPair.privateKeyArn
      ),
      publicKey: Secret.fromSecretCompleteArn(
        this,
        'JwtPublicKey',
        this.keyPair.publicKeyArn
      ),
    };

    this.ecsSecrets = {
      privateKey: EcsSecret.fromSecretsManager(this.secrets.privateKey),
      publicKey: EcsSecret.fromSecretsManager(this.secrets.publicKey),
    };
  }

  grantRead(taskRole: IRole) {
    this.keyPair.grantReadOnPrivateKey(taskRole);
    this.keyPair.grantReadOnPublicKey(taskRole);
  }
}
