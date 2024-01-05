import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import {
  IVpc,
  InstanceClass,
  InstanceSize,
  InstanceType,
  LaunchTemplate,
  SecurityGroup,
  SubnetType,
  UserData,
} from 'aws-cdk-lib/aws-ec2';
import {
  AmiHardwareType,
  AsgCapacityProvider,
  Cluster,
  EcsOptimizedImage,
} from 'aws-cdk-lib/aws-ecs';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export type CdkAsgCapacityEcsClusterProps = {
  vpc: IVpc;
  useSpotCapacity: boolean;
  enableManagedTerminationProtection?: boolean;
  instanceType?: InstanceType;
};

export class CdkAsgCapcityEcsCluster extends Construct {
  cluster: Cluster;
  asgRole: Role;
  securityGroup: SecurityGroup;
  asg: AutoScalingGroup;
  capacityProvider: AsgCapacityProvider;
  launchTemplate: LaunchTemplate;

  constructor(
    scope: Construct,
    id: string,
    props: CdkAsgCapacityEcsClusterProps
  ) {
    super(scope, id);

    const {
      vpc,
      useSpotCapacity,
      enableManagedTerminationProtection,
      instanceType = InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
    } = props;

    const cluster = (this.cluster = new Cluster(this, 'Cluster', {
      vpc,
    }));

    const asgRole = (this.asgRole = new Role(this, 'AsgTaskRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    }));

    const securityGroup = (this.securityGroup = new SecurityGroup(
      this,
      'SecurityGroup',
      {
        vpc,
      }
    ));

    const launchTemplate = (this.launchTemplate = new LaunchTemplate(
      this,
      `AsgLaunchTemplateAmd64${useSpotCapacity ? 'Spot' : 'Reserved'}`,
      {
        instanceType,
        machineImage: EcsOptimizedImage.amazonLinux2(AmiHardwareType.STANDARD),
        ...(useSpotCapacity
          ? {
              spotOptions: {},
            }
          : {}),
        securityGroup,
        userData: UserData.forLinux(),
        role: asgRole,
      }
    ));

    const asg = (this.asg = new AutoScalingGroup(this, 'Asg', {
      vpc,
      launchTemplate,
      maxCapacity: 10,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    }));

    const capacityProvider = (this.capacityProvider = new AsgCapacityProvider(
      this,
      'AsgCapacityProvider',
      {
        autoScalingGroup: asg,
        enableManagedTerminationProtection,
      }
    ));

    cluster.addAsgCapacityProvider(capacityProvider);

    cluster.connections.addSecurityGroup(securityGroup);
  }
}
