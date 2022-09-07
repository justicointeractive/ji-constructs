import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Construct } from 'constructs';
import { join } from 'path';
import { LambdaNpmFunction } from './cdk-lambda-npm-function';

describe('cdk-lambda-npm-function', () => {
  it('should bundle', async () => {
    const app = new App();

    class MyStack extends Stack {
      myFn: LambdaNpmFunction;

      constructor(scope: Construct, id: string) {
        super(scope, id);

        this.myFn = new LambdaNpmFunction(this, 'Fn', {
          projectRoot: join(__dirname, '../../test'),
          entry: 'echo.js',
        });
      }
    }

    const stack = new MyStack(app, 'Stack');

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Lambda::Function', 1);
  });
});
