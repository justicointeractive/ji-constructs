import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ImageResizeBehavior } from './image-resize-behavior';

describe('imageResizeBehavior', () => {
  it('should synth', () => {
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
});
