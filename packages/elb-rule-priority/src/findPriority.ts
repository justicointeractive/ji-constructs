import { ELBv2 } from "aws-sdk";
import { DescribeRulesOutput } from "aws-sdk/clients/elbv2";
import { range, shuffle } from "lodash";

export async function findPriority(
  listenerArn: string,
  hostname: string
): Promise<number | null> {
  const rules = await toArray(enumerateRules(listenerArn));

  const existingRule = rules?.find((r) =>
    r.Conditions?.some((condition) =>
      condition.HostHeaderConfig?.Values?.includes(hostname)
    )
  );

  if (existingRule?.Priority != null) {
    return Number(existingRule.Priority);
  }

  const shuffledPriorities = shuffle(range(1, 5000));
  for (const priority of shuffledPriorities) {
    const isInUse = rules?.some((rule) => rule.Priority === String(priority));
    if (!isInUse) {
      return priority;
    }
  }

  throw new Error("could not find a priority that was not in use");
}

export async function findPriorityOrFail(
  listenerArn: string,
  hostname: string
): Promise<number> {
  const priority = await findPriority(listenerArn, hostname);
  if (priority == null) {
    throw new Error(`unable to find suitable priority`);
  }
  return priority;
}

async function toArray<T>(asyncIterator: AsyncGenerator<T[]>) {
  const arr: T[] = [];
  for await (const i of asyncIterator) {
    arr.push(...i);
  }
  return arr;
}

async function* enumerateRules(
  listenerArn: string
): AsyncGenerator<ELBv2.Rule[]> {
  const elbv2 = new ELBv2();
  let nextMarker: string | undefined = undefined;
  do {
    const rulesResponse: DescribeRulesOutput = await elbv2
      .describeRules({
        Marker: nextMarker,
        ListenerArn: listenerArn,
      })
      .promise();

    yield rulesResponse.Rules!;
    nextMarker = rulesResponse.NextMarker;
  } while (nextMarker);
}
