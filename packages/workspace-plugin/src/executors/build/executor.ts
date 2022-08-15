import { ExecutorContext } from '@nrwl/devkit';
import { tscExecutor } from '@nrwl/js/src/executors/tsc/tsc.impl';
import { copy } from 'fs-extra';
import { BuildExecutorSchema } from './schema';

export default async function runExecutor(
  { embed, ...options }: BuildExecutorSchema,
  context: ExecutorContext
) {
  for await (const result of tscExecutor(options, context)) {
    if (!result.success) {
      return result;
    }
  }

  for (const embedded of embed ?? []) {
    await copy(
      `./dist/${embedded}`,
      `${options.outputPath}/embedded/${embedded}`
    );
  }

  return {
    success: true,
  };
}
