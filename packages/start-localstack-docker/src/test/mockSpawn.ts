import { exec } from 'child_process';

export function mockSpawn(
  ...invocations: {
    command: string;
    stdout?: string;
    stderr?: string;
  }[]
) {
  const mock = exec as unknown as jest.Mock;
  for (const invocation of invocations) {
    mock.mockImplementationOnce(
      (
        command: string,
        callback: (err: unknown, stdout: string, stderr: string) => void
      ) => {
        expect(command).toEqual(invocation.command);
        callback(null, invocation.stdout ?? '', invocation.stderr ?? '');
      }
    );
  }

  return () => {
    expect(mock).toHaveBeenCalledTimes(invocations.length);
  };
}
