#!/usr/bin/env node

import { spawnSync } from 'child_process';
import * as path from 'path';
import { findPriority } from './findPriority';

export * from './findPriority';

async function run(
  ...[listenerArn, hostname]: Parameters<typeof findPriority>
) {
  const priority = await findPriority(listenerArn, hostname);
  console.log(priority);
}

if (require.main === module) {
  const [, , args] = process.argv;
  const [listenerArn, hostname] = fromBase64Json(args);
  run(listenerArn, hostname);
}

export function findPrioritySync(
  ...[listenerArn, hostname]: Parameters<typeof findPriority>
) {
  const scriptPath = path.join(__dirname, './index.js');
  const result = spawnSync(
    'node',
    [scriptPath, toBase64Json([listenerArn, hostname])],
    {
      encoding: 'utf8',
    }
  );
  if (result.error != null) {
    throw result.error;
  }
  const asNumber = Number(result.stdout.trim());
  if (isNaN(asNumber) || asNumber === 0) {
    throw new Error(`invalid result: ${result.stdout}`);
  }
  return asNumber;
}

function toBase64Json<T>(args: T) {
  return Buffer.from(JSON.stringify(args)).toString('base64');
}

function fromBase64Json<T = any>(args: string) {
  return JSON.parse(Buffer.from(args, 'base64').toString('utf8')) as T;
}
