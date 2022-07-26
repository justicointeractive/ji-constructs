import { exec } from 'child_process';
import * as waitOn from 'wait-on';

export type StartLocalstackDockerOptions = {
  services?: string[];
  edgePort?: number;
  timeout?: number;
};

export async function startLocalstackDocker(
  options: StartLocalstackDockerOptions
): Promise<() => Promise<void>> {
  const envVars: Record<string, string> = {};
  const ports: Record<string, string> = {};

  if (options.services) {
    envVars['SERVICES'] = options.services.join(',');
  }
  const edgePort = (options.edgePort ?? 4566).toString();
  envVars['EDGE_PORT'] = edgePort;
  ports[edgePort] = edgePort;

  const execResult = await execPromise(
    [
      `docker run --rm -d`,
      serialize('-e', '=', envVars),
      serialize('-p', ':', ports),
      `localstack/localstack`,
    ].join(' ')
  );

  const dynamodbContainerId = execResult.stdout;

  await waitOn({
    resources: [`http://localhost:${edgePort}`],
    validateStatus: (status) => {
      return status === 404;
    },
    timeout: options.timeout,
  });

  return async () => {
    await execPromise(`docker stop ${dynamodbContainerId}`);
  };
}

function serialize(
  flag: string,
  assignmentSeparator: string,
  records: Record<string, string>
) {
  return Object.entries(records)
    .map(([key, value]) => `${flag} ${key}${assignmentSeparator}${value}`)
    .join(' ');
}

// util.promisify(exec) didn't play nice with mock
function execPromise(command: string) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) =>
    exec(command, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }
      return resolve({ stdout, stderr });
    })
  );
}
