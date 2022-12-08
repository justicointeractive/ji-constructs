import { findPrioritySync } from '@ji-constructs/elb-rule-priority';
import { Duration } from 'aws-cdk-lib';
import {
  Certificate,
  DnsValidatedCertificate,
} from 'aws-cdk-lib/aws-certificatemanager';
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
import { LoadBalancedServiceListenerLookup } from './LoadBalancedServiceListenerLookup';

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
      route53ZoneName,
      domainNameAliases,
    } = options;

    const domainZone = (this.hostedZone = HostedZone.fromLookup(
      this,
      'ECSZone',
      {
        domainName: route53ZoneName ?? domainNameToZoneName(domainName),
      }
    ));

    const { loadBalancer, listener, vpc, listenerArn } =
      typeof options.listener === 'string'
        ? new LoadBalancedServiceListenerLookup(
            this,
            'LBLookup',
            options.listener
          )
        : options.listener;

    this.loadBalancer = loadBalancer;

    const cluster = (this.cluster =
      'name' in options.cluster
        ? Cluster.fromClusterAttributes(this, 'ECSCluster', {
            vpc,
            clusterName: options.cluster.name,
            securityGroups: options.cluster.securityGroupIds.map((id, i) =>
              SecurityGroup.fromLookupById(this, `SecurityGroup${i + 1}`, id)
            ),
          })
        : options.cluster);

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

    for (const [i, alias] of (domainNameAliases ?? []).entries()) {
      new ApplicationListenerRule(this, `ALBListenerRuleAlias${i}`, {
        listener,
        priority: findPrioritySync(listenerArn, alias.domainName),
        conditions: [ListenerCondition.hostHeaders([alias.domainName])],
        action: ListenerAction.forward([targetGroup]),
      });

      new ApplicationListenerCertificate(this, `ALBListenerCertAlias${i}`, {
        listener,
        certificates: [alias.certificate],
      });
    }

    const service = serviceFactory(this, cluster, {
      vpc,
      targetGroup,
      hostedZone: domainZone,
    });

    targetGroup.addTarget(service);
  }
}

export interface LoadBalancedServiceAlias {
  certificate: Certificate;
  domainName: string;
}
export interface LoadBalancedServiceContext {
  domainName: string;
  listener: string | LoadBalancedServiceListenerLookup;
  cluster: ICluster | { name: string; securityGroupIds: string[] };
  route53ZoneName?: string;
  domainNameAliases?: LoadBalancedServiceAlias[];
}
export interface LoadBalancedServiceDefaults {
  createRoute53ARecord?: boolean;
  targetGroupProps?: Partial<ApplicationTargetGroupProps>;
}

export interface LoadBalancedServiceFactories {
  serviceFactory: (
    scope: Construct,
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
