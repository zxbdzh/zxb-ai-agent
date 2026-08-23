import { execFile } from 'node:child_process';

export interface CommandResult {
  stdout: Buffer;
  stderr: Buffer;
  exitCode: number;
}

export interface CommandRunner {
  run(argv: readonly string[], options?: { cwd?: string; timeoutMs?: number; maxBuffer?: number }): Promise<CommandResult>;
}

export function fixedChildEnvironment(source: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return Object.fromEntries([
    ['PATH', source.PATH],
    ['Path', source.Path],
    ['SystemRoot', source.SystemRoot],
    ['COMSPEC', source.COMSPEC],
    ['PATHEXT', source.PATHEXT],
    ['HOME', source.HOME],
    ['TMPDIR', source.TMPDIR],
    ['TEMP', source.TEMP],
    ['TMP', source.TMP],
    ['LC_ALL', 'C'],
    ['GIT_TERMINAL_PROMPT', '0'],
  ].filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

export class FixedGitRunner implements CommandRunner {
  async run(argv: readonly string[], options: { cwd?: string; timeoutMs?: number; maxBuffer?: number } = {}): Promise<CommandResult> {
    if (argv[0] !== 'git') throw new Error('only the fixed git executable is permitted');
    const allowedSubcommands = new Set(['ls-tree', 'show', 'cat-file', 'diff', 'rev-list', 'merge-base']);
    if (!argv[1] || !allowedSubcommands.has(argv[1])) throw new Error('git subcommand is not allowlisted');
    if (argv.some((arg) => arg.includes('\0'))) throw new Error('argv contains NUL');
    const childEnv = fixedChildEnvironment();
    return await new Promise((resolve, reject) => {
      execFile('git', [...argv.slice(1)], {
        cwd: options.cwd,
        timeout: options.timeoutMs ?? 20_000,
        maxBuffer: options.maxBuffer ?? 16 * 1024 * 1024,
        windowsHide: true,
        shell: false,
        env: childEnv,
        encoding: 'buffer',
      }, (error, stdout, stderr) => {
        if (error && typeof (error as { code?: unknown }).code !== 'number') return reject(error);
        resolve({ stdout: Buffer.from(stdout), stderr: Buffer.from(stderr), exitCode: error ? ((error as { code?: number }).code ?? 1) : 0 });
      });
    });
  }
}
