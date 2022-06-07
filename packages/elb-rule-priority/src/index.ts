#!/usr/bin/env node

import { spawnSync } from "child_process";
import * as path from "path";
import { findPriority } from "./findPriority";

export * from "./findPriority";

async function run(listenerArn: string, hostname: string) {
  const priority = await findPriority(listenerArn, hostname);
  console.log(priority);
}

if (require.main === module) {
  const [, , listenerArn, hostname] = process.argv;
  run(listenerArn, hostname);
}

export function findPrioritySync(listenerArn: string, hostname: string) {
  const scriptPath = path.join(__dirname, "./index.js");
  const result = spawnSync(scriptPath, [listenerArn, hostname], {
    encoding: "utf8",
  });
  const asNumber = Number(result.stdout.trim());
  if (isNaN(asNumber) || asNumber === 0) {
    throw new Error(`invalid result: ${result.stdout}`);
  }
  return asNumber;
}
