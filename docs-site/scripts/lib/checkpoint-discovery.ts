import type { CommandRunner } from './command-runner.js';
import { assertFullSha } from './identity.js';
import { validateCheckpointTrailers } from './trailers.js';

export interface DiscoveryInput {
  event: 'push' | 'workflow_dispatch';
  before?: string;
  after?: string;
  requestedSha?: string;
}

export async function discoverCheckpointShas(runner: CommandRunner, repositoryRoot: string, input: DiscoveryInput): Promise<readonly string[]> {
  let candidates: string[];
  if (input.event === 'workflow_dispatch') {
    const requested = assertFullSha(input.requestedSha ?? '');
    const ancestor = await runner.run(['git', 'merge-base', '--is-ancestor', requested, 'refs/remotes/origin/master'], { cwd: repositoryRoot });
    if (ancestor.exitCode !== 0) throw new Error('manual checkpoint SHA must be an ancestor of origin/master');
    candidates = [requested];
  } else {
    const after = assertFullSha(input.after ?? '');
    const before = input.before ?? '';
    const revision = /^0{40}$/.test(before) ? after : `${assertFullSha(before)}..${after}`;
    const result = await runner.run(['git', 'rev-list', '--reverse', revision], { cwd: repositoryRoot });
    if (result.exitCode !== 0) throw new Error('unable to enumerate pushed commits');
    candidates = result.stdout.toString('ascii').trim().split(/\r?\n/).filter(Boolean).map(assertFullSha);
    if (candidates.length > 1000) throw new Error('push range exceeds the 1000-commit reconciliation bound');
  }

  const checkpoints: string[] = [];
  for (const sha of candidates) {
    const result = await runner.run(['git', 'show', '-s', '--format=%B', sha], { cwd: repositoryRoot });
    if (result.exitCode !== 0) throw new Error(`unable to inspect candidate commit: ${sha}`);
    const message = result.stdout.toString('utf8');
    const validation = validateCheckpointTrailers(message);
    const generatedDocsCommit = message.split(/\r?\n/, 1)[0]?.startsWith('docs(learning): 自动生成学习文档') ?? false;
    if (validation.kind === 'checkpoint' && !generatedDocsCommit) checkpoints.push(sha);
  }
  if (input.event === 'workflow_dispatch' && checkpoints.length !== 1) throw new Error('manual SHA is not a Learning Checkpoint');
  return [...new Set(checkpoints)];
}

export function checkpointMatrix(shas: readonly string[], event: 'push' | 'workflow_dispatch'): { include: Array<{ sha: string; event: 'push' | 'workflow_dispatch' }> } {
  if (event !== 'push' && event !== 'workflow_dispatch') throw new Error('invalid checkpoint event');
  return { include: shas.map((sha) => ({ sha: assertFullSha(sha), event })) };
}
