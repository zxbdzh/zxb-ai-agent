import test from 'node:test';
import assert from 'node:assert/strict';
import { checkpointMatrix, discoverCheckpointShas } from '../../scripts/lib/checkpoint-discovery.js';
import type { CommandResult, CommandRunner } from '../../scripts/lib/command-runner.js';

const ordinary = 'a'.repeat(40);
const firstCheckpoint = 'b'.repeat(40);
const tip = 'c'.repeat(40);
const checkpointMessage = 'feat(agent): 检查点\n\nLearning-Checkpoint: 对话记忆\nLearning-Motivation: 动机\nLearning-Outcome: 结果\n';

class DiscoveryRunner implements CommandRunner {
  calls: string[][] = [];
  async run(argv: readonly string[]): Promise<CommandResult> {
    this.calls.push([...argv]);
    if (argv[1] === 'rev-list') return result(`${ordinary}\n${firstCheckpoint}\n${tip}\n`);
    if (argv[1] === 'merge-base') return result('');
    const sha = argv.at(-1);
    return result(sha === firstCheckpoint ? checkpointMessage : 'fix(agent): 普通提交\n');
  }
}
function result(stdout: string, exitCode = 0): CommandResult { return { stdout: Buffer.from(stdout), stderr: Buffer.alloc(0), exitCode }; }

test('push discovery finds an earlier checkpoint in a multi-commit range', async () => {
  const runner = new DiscoveryRunner();
  assert.deepEqual(await discoverCheckpointShas(runner, 'repo', { event: 'push', before: ordinary, after: tip }), [firstCheckpoint]);
  assert.deepEqual(runner.calls[0], ['git', 'rev-list', '--reverse', `${ordinary}..${tip}`]);
});

test('manual discovery proves master ancestry and checkpoint trailers', async () => {
  const runner = new DiscoveryRunner();
  assert.deepEqual(await discoverCheckpointShas(runner, 'repo', { event: 'workflow_dispatch', requestedSha: firstCheckpoint }), [firstCheckpoint]);
  assert.deepEqual(runner.calls[0], ['git', 'merge-base', '--is-ancestor', firstCheckpoint, 'refs/remotes/origin/master']);
});

test('matrix preserves full SHA identity and order', () => {
  assert.deepEqual(checkpointMatrix([firstCheckpoint, tip], 'push'), { include: [{ sha: firstCheckpoint, event: 'push' }, { sha: tip, event: 'push' }] });
  assert.throws(() => checkpointMatrix(['short'], 'push'));
});
