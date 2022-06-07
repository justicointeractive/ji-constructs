import { findPrioritySync } from '@ji-constructs/elb-rule-priority';
import { Duration } from 'aws-cdk-lib';
import { DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { IVpc, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Cluster, Ec2Service, ICluster } from 'aws-cdk-lib/aws-ecs';
import {
  ApplicationListenerCertificate,
  ApplicationListenerRule,
  ApplicationProtocol,
  ApplicationTargetGroup,
  ApplicationTargetGroupProps,
  IApplicationLoadBalancer,
  ListenerAction,
  ListenerCondition,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {
  ARecord,
  HostedZone,
  IHostedZone,
  RecordTarget,
} from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
import * as cdk from 'constructs';
import { Construct } from 'constructs';
import { domainNameToZoneName } from './domainNameToZoneName';
import { LoadBalancedServiceLoadBalancerListenerVpcLookup } from './LoadBalancedServiceLoadBalancerListenerVpcLookup';

export class LoadBalancedService extends Construct {
  certificate: DnsValidatedCertificate;
  cluster: ICluster;
  loadBalancer: IApplicationLoadBalancer;
  hostedZone: IHostedZone;

  constructor(
    scope: cdk.Construct,
    id: string,
    options: LoadBalancedServiceOptions
  ) {
    super(scope, id);

    const {
      targetGroupProps = {},
      createRoute53ARecord = true,
      serviceFactory,
      domainName,
      clusterOrClusterName,
      loadBalancerListenerArnOrLookup,
      route53ZoneName,
    } = options;

    const domainZone = (this.hostedZone = HostedZone.fromLookup(
      this,
      'ECSZone',
      {
        domainName: route53ZoneName ?? domainNameToZoneName(domainName),
      }
    ));

    const { loadBalancer, listener, vpc, listenerArn } =
      typeof loadBalancerListenerArnOrLookup === 'string'
        ? new LoadBalancedServiceLoadBalancerListenerVpcLookup(
            this,
            'LBLookup',
            loadBalancerListenerArnOrLookup
          )
        : loadBalancerListenerArnOrLookup;

    this.loadBalancer = loadBalancer;

    const cluster = (this.cluster =
      'name' in clusterOrClusterName
        ? Cluster.fromClusterAttributes(this, 'ECSCluster', {
            vpc,
            clusterName: clusterOrClusterName.name,
            securityGroups: clusterOrClusterName.securityGroupIds.map((id, i) =>
              SecurityGroup.fromLookupById(this, `SecurityGroup${i + 1}`, id)
            ),
          })
        : clusterOrClusterName);

    cluster.connections.allowFrom(loadBalancer.connections, Port.allTcp());

    const targetGroup = new ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      protocol: ApplicationProtocol.HTTP,
      deregistrationDelay: Duration.seconds(15),
      stickinessCookieDuration: Duration.days(1),
      ...targetGroupProps,
    });

    const cert = (this.certificate = new DnsValidatedCertificate(
      this,
      'ACMCert',
      {
        domainName,
        hostedZone: domainZone,
      }
    ));

    new ApplicationListenerRule(this, 'ALBListenerRule', {
      listener,
      priority: findPrioritySync(listenerArn, domainName),
      conditions: [ListenerCondition.hostHeaders([domainName])],
      action: ListenerAction.forward([targetGroup]),
    });

    new ApplicationListenerCertificate(this, 'ALBListenerCert', {
      listener,
      certificates: [cert],
    });

    if (createRoute53ARecord) {
      new ARecord(this, 'ALBAlias', {
        recordName: domainName,
        zone: domainZone,
        target: RecordTarget.fromAlias(new LoadBalancerTarget(loadBalancer)),
      });
    }

    const service = serviceFactory(cluster, {
      vpc,
      targetGroup,
      hostedZone: domainZone,
    });

    targetGroup.addTarget(service);
  }
}

export interface LoadBalancedServiceContext {
  domainName: string;
  loadBalancerListenerArnOrLookup:
    | string
    | LoadBalancedServiceLoadBalancerListenerVpcLookup;
  route53ZoneName?: string;
  clusterOrClusterName: ICluster | { name: string; securityGroupIds: string[] };
}
export interface LoadBalancedServiceDefaults {
  createRoute53ARecord?: boolean;
  targetGroupProps?: Partial<ApplicationTargetGroupProps>;
}

export interface LoadBalancedServiceFactories {
  serviceFactory: (
    cluster: ICluster,
    extras: {
      vpc: IVpc;
      targetGroup: ApplicationTargetGroup;
      hostedZone: IHostedZone;
    }
  ) => Ec2Service;
}

export type LoadBalancedServiceOptions = LoadBalancedServiceContext &
  LoadBalancedServiceDefaults &
  LoadBalancedServiceFactories;
