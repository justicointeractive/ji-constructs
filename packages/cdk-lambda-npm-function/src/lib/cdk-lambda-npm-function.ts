import { readJsonFile } from '@nrwl/devkit';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { existsSync } from 'fs';

export class LambdaNpmFunction extends NodejsFunction {
  constructor(
    scope: Construct,
    id: string,
    props: {
      projectRoot: string;
      entry?: string;
      handler?: string;
      lockfile?: string;
      nodejsFunctionProps?: NodejsFunctionProps;
    }
  ) {
    const {
      projectRoot,
      entry,
      lockfile = 'package-lock.json',
      handler = 'handler',
      nodejsFunctionProps,
    } = props;

    const packageJsonPath = `${projectRoot}/package.json`;

    const packageJsonContents = existsSync(packageJsonPath)
      ? readJsonFile<
          Partial<{
            dependencies: Record<string, string>;
            devDependencies: Record<string, string>;
            main: string;
          }>
        >(packageJsonPath)
      : {};

    super(scope, id, {
      bundling: {
        minify: true,
        nodeModules: [
          ...Object.keys(packageJsonContents.dependencies ?? {}),
          ...Object.keys(packageJsonContents.devDependencies ?? {}),
        ],
        commandHooks: {
          beforeInstall: () => [],
          beforeBundling: () => [],
          afterBundling: () => [`rm ${lockfile}`],
        },
      },
      projectRoot,
      depsLockFilePath: `${projectRoot}/${lockfile}`,
      entry: `${projectRoot}/${entry ?? packageJsonContents.main ?? 'main.js'}`,
      handler,
      runtime: Runtime.NODEJS_16_X,
      ...nodejsFunctionProps,
    });
  }
}
