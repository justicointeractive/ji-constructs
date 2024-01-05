import { findPrioritySync } from '@ji-constructs/elb-rule-priority';
import { Duration } from 'aws-cdk-lib';
import {
  Certificate,
  CertificateValidation,
  ICertificate,
} from 'aws-cdk-lib/aws-certificatemanager';
import { IVpc, Port } from 'aws-cdk-lib/aws-ec2';
import { Ec2Service } from 'aws-cdk-lib/aws-ecs';
import {
  ApplicationListenerCertificate,
  ApplicationListenerRule,
  ApplicationProtocol,
  ApplicationTargetGroup,
  ApplicationTargetGroupProps,
  HealthCheck,
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
import { LoadBalancedServiceListenerLookup } from './LoadBalancedServiceListenerLookup';
import { domainNameToZoneName } from './domainNameToZoneName';

export class LoadBalancedService extends Construct {
  loadBalancer: IApplicationLoadBalancer;
  listener: LoadBalancedServiceListenerLookup;
  vpc: IVpc;

  constructor(
    scope: cdk.Construct,
    id: string,
    options: LoadBalancedServiceOptions
  ) {
    super(scope, id);

    const { loadBalancer, vpc } = (this.listener =
      typeof options.listener === 'string'
        ? new LoadBalancedServiceListenerLookup(
            this,
            'LBLookup',
            options.listener
          )
        : options.listener);

    this.loadBalancer = loadBalancer;
    this.vpc = vpc;
  }

  addTarget(
    options: LoadBalancedServiceTargetOptions
  ): LoadBalancedServiceTarget {
    const {
      healthCheck,
      targetGroupProps = {},
      createRoute53ARecord = true,
      domainName,
      route53ZoneName,
      domainNameAliases,
      service,
    } = options;

    const { loadBalancer, listener, vpc, listenerArn } = this.listener;

    const domainZone = HostedZone.fromLookup(this, 'ECSZone', {
      domainName: route53ZoneName ?? domainNameToZoneName(domainName),
    });

    const targetGroup = new ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      protocol: ApplicationProtocol.HTTP,
      deregistrationDelay: Duration.seconds(15),
      stickinessCookieDuration: Duration.days(1),
      healthCheck,
      ...targetGroupProps,
    });

    const cert =
      options.certificate ??
      new Certificate(this, 'ACMCert', {
        domainName,
        validation: CertificateValidation.fromDns(domainZone),
      });

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

    targetGroup.addTarget(service);

    this.loadBalancer.connections.allowTo(service, Port.allTcp());

    return {
      service,
      targetGroup,
      cert,
      domainZone,
    };
  }
}

export interface LoadBalancedServiceAlias {
  certificate: ICertificate;
  domainName: string;
}
export interface LoadBalancedServiceContext {
  listener: string | LoadBalancedServiceListenerLookup;
}

export type LoadBalancedServiceOptions = LoadBalancedServiceContext;

export type LoadBalancedServiceTargetOptions = {
  domainName: string;
  service: Ec2Service;
  healthCheck: HealthCheck;
  route53ZoneName?: string;
  domainNameAliases?: LoadBalancedServiceAlias[];
  certificate?: ICertificate;
  createRoute53ARecord?: boolean;
  targetGroupProps?: Partial<ApplicationTargetGroupProps>;
};

export type LoadBalancedServiceTarget = {
  service: Ec2Service;
  targetGroup: ApplicationTargetGroup;
  cert: ICertificate;
  domainZone: IHostedZone;
};
