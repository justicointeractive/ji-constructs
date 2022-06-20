jest.mock('child_process');

import { mockSpawn } from '../test/mockSpawn';
import { startLocalstackDocker } from './start-localstack-docker';

beforeEach(() => {
  jest.resetAllMocks();
});

describe('startLocalstackDocker', () => {
  it('should start and stop localstack', async () => {
    const allSpawns = mockSpawn(
      {
        command:
          'docker run --rm -d -e SERVICES=dynamodb -e EDGE_PORT=4555 -p 4555:4555 localstack/localstack',
        stdout: 'abc123',
      },
      {
        command: 'docker stop abc123',
      }
    );

    const shutdown = await startLocalstackDocker({
      services: ['dynamodb'],
      edgePort: 4555,
    });

    await shutdown();

    allSpawns();

    expect(true); // silence linter
  });
});
