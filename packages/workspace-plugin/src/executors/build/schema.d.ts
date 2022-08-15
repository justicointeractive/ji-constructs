import { ExecutorOptions } from '@nrwl/js/src/utils/schema';

export interface BuildExecutorSchema extends ExecutorOptions {
  embed: string[];
}
