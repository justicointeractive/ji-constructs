import * as assert from 'assert';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import {
  ApplicationListener,
  ApplicationLoadBalancer,
  ApplicationProtocol,
  IApplicationListener,
  IApplicationLoadBalancer,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { listenerArnToAlbArn } from './listenerArnToAlbArn';

export class LoadBalancedServiceListenerLookup extends Construct {
  loadBalancer: IApplicationLoadBalancer;
  vpc: IVpc;
  listener: IApplicationListener;

  constructor(scope: Construct, id: string, public listenerArn?: string) {
    super(scope, id);

    this.loadBalancer = ApplicationLoadBalancer.fromLookup(
      this,
      `LoadBalancer`,
      listenerArn != null
        ? {
            loadBalancerArn: listenerArnToAlbArn(listenerArn),
          }
        : {
            loadBalancerTags: {
              'JI-LoadBalancer': '1',
            },
          }
    );

    this.listener = ApplicationListener.fromLookup(
      this,
      'Listener',
      listenerArn != null
        ? {
            listenerArn: listenerArn,
          }
        : {
            listenerProtocol: ApplicationProtocol.HTTPS,
            loadBalancerTags: {
              'JI-LoadBalancer': '1',
            },
          }
    );

    const vpc = this.loadBalancer.vpc;

    assert(vpc, `vpc value should exist`);

    this.vpc = vpc;
  }
}
