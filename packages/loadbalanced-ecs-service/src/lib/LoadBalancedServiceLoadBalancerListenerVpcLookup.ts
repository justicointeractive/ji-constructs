import * as assert from 'assert';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import {
  ApplicationListener,
  ApplicationLoadBalancer,
  IApplicationListener,
  IApplicationLoadBalancer,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { listenerArnToAlbArn } from './listenerArnToAlbArn';

export class LoadBalancedServiceLoadBalancerListenerVpcLookup extends Construct {
  loadBalancer: IApplicationLoadBalancer;
  vpc: IVpc;
  listener: IApplicationListener;

  constructor(scope: Construct, id: string, public listenerArn: string) {
    super(scope, id);

    this.loadBalancer = ApplicationLoadBalancer.fromLookup(
      this,
      `LoadBalancer`,
      {
        loadBalancerArn: listenerArnToAlbArn(listenerArn),
      }
    );

    this.listener = ApplicationListener.fromLookup(this, 'Listener', {
      listenerArn: listenerArn,
    });

    const vpc = this.loadBalancer.vpc;

    assert(vpc, `vpc value should exist`);

    this.vpc = vpc;
  }
}
