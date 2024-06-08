import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ELBv2 } from 'aws-sdk';
import {
  DescribeListenersOutput,
  DescribeLoadBalancersOutput,
  DescribeRulesOutput,
} from 'aws-sdk/clients/elbv2';
import { range, shuffle } from 'lodash';

const elbv2 = new ELBv2();

export const listenerRuleIdTag = 'JI-ListenerRule-ID';

export async function findPriority(
  listener:
    | string
    | {
        listenerProtocol: ApplicationProtocol;
        loadBalancerTags: Record<string, string>;
      },
  listenerRuleId: string
): Promise<number | null> {
  const listenerArn =
    typeof listener === 'string'
      ? listener
      : await resolveListenerArn(listener);
  const rules = await toArray(enumerateRules(listenerArn));

  const tags = await elbv2
    .describeTags({
      ResourceArns: rules.map((r) => r.RuleArn!),
    })
    .promise();

  let existingRule;
  for (const rule of rules) {
    const ruleTags = tags.TagDescriptions?.find(
      (t) => t.ResourceArn === rule.RuleArn
    );
    const ruleIdTag = ruleTags?.Tags?.find((t) => t.Key === listenerRuleIdTag);
    if (ruleIdTag?.Value === listenerRuleId) {
      existingRule = rule;
      break;
    }
  }

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

  throw new Error('could not find a priority that was not in use');
}

export async function findPriorityOrFail(
  listenerArn: string,
  listenerRuleId: string
): Promise<number> {
  const priority = await findPriority(listenerArn, listenerRuleId);
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

async function resolveListenerArn(query: {
  listenerProtocol: ApplicationProtocol;
  loadBalancerTags: Record<string, string>;
}) {
  const elbv2 = new ELBv2();

  // enumerate load balancers finding the first one that matches the tags
  let nextMarker: string | undefined = undefined;
  do {
    const loadBalancersResponse: DescribeLoadBalancersOutput = await elbv2
      .describeLoadBalancers({
        Marker: nextMarker,
      })
      .promise();

    const loadBalancerTags = await elbv2
      .describeTags({
        ResourceArns: loadBalancersResponse.LoadBalancers!.map(
          (lb) => lb.LoadBalancerArn!
        ),
      })
      .promise();

    const loadBalancerArn = loadBalancerTags.TagDescriptions?.find((t) => {
      return Object.entries(query.loadBalancerTags).every(([k, v]) => {
        return t.Tags?.some((tag) => tag.Key === k && tag.Value === v);
      });
    })?.ResourceArn;

    const listeners: DescribeListenersOutput = await elbv2
      .describeListeners({
        LoadBalancerArn: loadBalancerArn,
      })
      .promise();

    const listener = listeners.Listeners?.find((l) => {
      return l.Protocol === query.listenerProtocol;
    });

    if (listener) {
      return listener.ListenerArn!;
    }

    nextMarker = loadBalancersResponse.NextMarker;
  } while (nextMarker);
  throw new Error('could not find listener');
}
