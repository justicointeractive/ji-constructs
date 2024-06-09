import {
  ListenerFilter,
  findPrioritySync,
  listenerRuleIdTag,
} from '@ji-constructs/elb-rule-priority';
import { Duration, Stack, Tags } from 'aws-cdk-lib';
import {
  Certificate,
  CertificateValidation,
  ICertificate,
} from 'aws-cdk-lib/aws-certificatemanager';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
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
  targets: LoadBalancedServiceTarget[] = [];

  constructor(
    scope: cdk.Construct,
    id: string,
    options: LoadBalancedServiceOptions = {}
  ) {
    super(scope, id);

    const { loadBalancer, vpc } = (this.listener =
      options.listener == null || typeof options.listener === 'string'
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
    const target = new LoadBalancedServiceTarget(
      this,
      `Target${this.targets.length}`,
      options
    );
    this.targets.push(target);
    return target;
  }
}

export interface LoadBalancedServiceAlias {
  certificate: ICertificate;
  domainName: string;
}

export type LoadBalancedServiceOptions = {
  listener?: string | LoadBalancedServiceListenerLookup;
};

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

export class LoadBalancedServiceTarget extends Construct {
  targetGroup: ApplicationTargetGroup;
  cert: ICertificate;
  domainZone: IHostedZone;

  constructor(
    scope: LoadBalancedService,
    id: string,
    options: LoadBalancedServiceTargetOptions
  ) {
    super(scope, id);

    const {
      healthCheck,
      targetGroupProps = {},
      createRoute53ARecord = true,
      domainName,
      route53ZoneName,
      domainNameAliases,
      service,
    } = options;

    const { loadBalancer, listener, vpc, listenerArn } = scope.listener;

    const domainZone = (this.domainZone = HostedZone.fromLookup(
      this,
      'ECSZone',
      {
        domainName: route53ZoneName ?? domainNameToZoneName(domainName),
      }
    ));

    const targetGroup = (this.targetGroup = new ApplicationTargetGroup(
      this,
      'TargetGroup',
      {
        vpc,
        protocol: ApplicationProtocol.HTTP,
        deregistrationDelay: Duration.seconds(15),
        stickinessCookieDuration: Duration.days(1),
        healthCheck,
        ...targetGroupProps,
      }
    ));

    const listenerFilter = listenerArn ?? {
      listenerProtocol: ApplicationProtocol.HTTPS,
      loadBalancerTags: {
        'JI-LoadBalancer': '1',
      },
    };

    const cert = (this.cert =
      options.certificate ??
      new Certificate(this, 'ACMCert', {
        domainName,
        validation: CertificateValidation.fromDns(domainZone),
      }));

    withPriority(
      this,
      'ALBListenerRule',
      listenerFilter,
      (id, priority) =>
        new ApplicationListenerRule(this, id, {
          listener,
          priority,
          conditions: [ListenerCondition.hostHeaders([domainName])],
          action: ListenerAction.forward([targetGroup]),
        })
    );

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
      withPriority(
        this,
        `ALBListenerRuleAlias${i}`,
        listenerFilter,
        (id, priority) =>
          new ApplicationListenerRule(this, id, {
            listener,
            priority,
            conditions: [ListenerCondition.hostHeaders([alias.domainName])],
            action: ListenerAction.forward([targetGroup]),
          })
      );

      new ApplicationListenerCertificate(this, `ALBListenerCertAlias${i}`, {
        listener,
        certificates: [alias.certificate],
      });
    }

    if (service.connections.securityGroups.length === 0) {
      throw new Error(
        'Service must have a security group attached to it before adding it as a target to a load balancer'
      );
    }

    targetGroup.addTarget(service);
  }
}

function withPriority(
  scope: Construct,
  id: string,
  listenerFilter: ListenerFilter,
  listener: (id: string, priority: number) => ApplicationListenerRule
) {
  const listenerRulePath = [
    Stack.of(scope).stackName,
    scope.node.path,
    id,
  ].join('/');
  const priority = findPrioritySync(listenerFilter, listenerRulePath);
  const listenerRule = listener(id, priority);
  Tags.of(listenerRule).add(listenerRuleIdTag, listenerRulePath);
  return listenerRule;
}
