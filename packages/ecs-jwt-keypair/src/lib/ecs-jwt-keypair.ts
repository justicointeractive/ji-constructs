import { Secret as EcsSecret } from 'aws-cdk-lib/aws-ecs';
import { Role } from 'aws-cdk-lib/aws-iam';
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

    this.keyPair = new KeyPair(this, 'KeyPair', {
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

  grantRead(taskRole: Role) {
    this.keyPair.grantReadOnPrivateKey(taskRole);
    this.keyPair.grantReadOnPublicKey(taskRole);
  }
}
