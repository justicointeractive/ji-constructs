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
      /**
       * a directory with a package.json file that declares dependencies/devDependencies and main entry point
       */
      projectRoot: string;
      entry?: string;
      handler?: string;
      lockfile?: string;
    } & Omit<
      NodejsFunctionProps,
      'projectRoot' | 'entry' | 'handler' | 'depsLockFilePath'
    >
  ) {
    const {
      projectRoot,
      entry,
      lockfile = 'package-lock.json',
      handler = 'handler',
      bundling,
      ...nodejsFunctionProps
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
        /**
         *  DO NOT FORCE DOCKER BUNDLING:
         *  docker bundling requires the ability to mount a volume in the container
         *  remote docker (circleci) cannot mount a host volume in the container
         */
        // forceDockerBundling: true,
        nodeModules: [
          ...Object.keys(packageJsonContents.dependencies ?? {}),
          ...Object.keys(packageJsonContents.devDependencies ?? {}),
        ],
        commandHooks: {
          beforeInstall: () => [],
          beforeBundling: () => [],
          afterBundling: () => [`rm ${lockfile}`],
        },
        ...bundling,
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
