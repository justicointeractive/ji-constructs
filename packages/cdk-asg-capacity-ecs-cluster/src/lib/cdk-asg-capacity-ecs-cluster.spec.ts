import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { CdkAsgCapcityEcsCluster } from './cdk-asg-capacity-ecs-cluster';

describe('cdkSharedDatabase', () => {
  it('should work with a created db instance', () => {
    const app = new App();

    const stack = new Stack(app, 'TestStack');

    const vpc = new Vpc(stack, 'Vpc');

    new CdkAsgCapcityEcsCluster(stack, 'TestConstruct', {
      vpc,
      useSpotCapacity: true,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::IAM::Role', 1);
    template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
    template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);
    template.resourceCountIs('AWS::ECS::Cluster', 1);
  });
});
