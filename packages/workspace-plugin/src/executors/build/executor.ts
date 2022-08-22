import {
  ExecutorContext,
  ProjectGraphProjectNode,
  readCachedProjectGraph,
  readJsonFile,
  writeJsonFile,
} from '@nrwl/devkit';
import { tscExecutor } from '@nrwl/js/src/executors/tsc/tsc.impl';
import { existsSync } from 'fs';
import { copy, ensureDir } from 'fs-extra';
import { resolve } from 'path';
import { BuildExecutorSchema } from './schema';
import assert = require('assert');

export default async function runExecutor(
  { embed, ...options }: BuildExecutorSchema,
  context: ExecutorContext
) {
  assert(context.projectName);

  const projectSrcRoot =
    context.workspace.projects[context.projectName].sourceRoot;
  assert(projectSrcRoot);

  ensureDir(options.outputPath);

  for await (const result of tscExecutor(options, context)) {
    if (!result.success) {
      return result;
    }
  }

  createPackageJsonWithPublishableDependencies(options, context);

  for (const embedded of embed ?? []) {
    await copy(
      `./dist/${embedded}`,
      `${options.outputPath}/embedded/${embedded}`
    );
    await copy(
      `./package-lock.json`,
      `${options.outputPath}/embedded/${embedded}/package-lock.json`
    );
  }

  return {
    success: true,
  };
}

function createPackageJsonWithPublishableDependencies(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  assert(context.projectName);

  const depGraph = readCachedProjectGraph();

  const project = depGraph.nodes[context.projectName];

  assert(project);

  const packageJson = readBuiltPackageJson(project);

  const projDeps = depGraph.dependencies[context.projectName];

  projDeps.forEach((dep) => {
    const depProject = depGraph.nodes[dep.target];

    if (depProject == null) {
      return;
    }

    const dependentPackageJson = readBuiltPackageJson(depProject);

    ['dependencies', 'devDependencies', 'peerDependencies'].forEach(
      (depType) => {
        if (
          packageJson[depType] &&
          dep.target in packageJson[depType] &&
          !dep.target.startsWith('npm:') &&
          dependentPackageJson != null
        ) {
          const { version } = dependentPackageJson;
          packageJson[depType][dep.target] = version;
        }
      }
    );
  });

  writeJsonFile(`${options.outputPath}/package.json`, packageJson);
}

function readBuiltPackageJson(project: ProjectGraphProjectNode) {
  const packageJsonPath = resolve(
    project.data.targets.build.options.outputPath,
    './package.json'
  );
  return existsSync(packageJsonPath) ? readJsonFile(packageJsonPath) : null;
}
