import { EcsJwtKeyPair } from '@ji-constructs/ecs-jwt-keypair';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ImageResizeBehavior } from './image-resize-behavior';

describe('imageResizeBehavior', () => {
  it('should create template', () => {
    const app = new App();

    const stack = new Stack(app, 'TestStack');

    new ImageResizeBehavior(stack, 'ImageResize', {
      embedRootDir: `./dist/packages/image-resize-behavior/embedded`,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Lambda::Function', 3);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  it('should create behavior without distribution', () => {
    const app = new App();

    const stack = new Stack(app, 'TestStack');

    new ImageResizeBehavior(stack, 'ImageResize', {
      embedRootDir: `./dist/packages/image-resize-behavior/embedded`,
      createDistribution: false,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Lambda::Function', 3);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::CloudFront::Distribution', 0);
  });

  it('should create template with signed urls', () => {
    const app = new App();

    const stack = new Stack(app, 'TestStack');

    const keyPair = new EcsJwtKeyPair(stack, 'KeyPair');

    new ImageResizeBehavior(stack, 'ImageResize', {
      embedRootDir: `./dist/packages/image-resize-behavior/embedded`,
      signedUrlPublicKey: keyPair.secrets.publicKey,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Lambda::Function', 4);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    template.resourceCountIs('AWS::CloudFront::PublicKey', 1);
    template.resourceCountIs('AWS::CloudFront::KeyGroup', 1);
  });
});
