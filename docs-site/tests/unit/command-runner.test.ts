import test from 'node:test';
import assert from 'node:assert/strict';
import { FixedGitRunner, fixedChildEnvironment } from '../../scripts/lib/command-runner.js';

test('fixed runner rejects executable and git subcommands outside the allowlist', async () => {
  const runner = new FixedGitRunner();
  await assert.rejects(() => runner.run(['sh', '-c', 'echo unsafe']));
  await assert.rejects(() => runner.run(['git', 'clean', '-fdx']));
});

test('fixed child environment strips model secrets and repository write tokens', () => {
  const env = fixedChildEnvironment({ PATH: '/bin', HOME: '/home/test', OPENAI_API_KEY: 'secret', GH_TOKEN: 'write-token', GITHUB_TOKEN: 'token' });
  assert.equal(env.PATH, '/bin');
  assert.equal(env.HOME, '/home/test');
  assert.equal(env.GIT_TERMINAL_PROMPT, '0');
  assert.equal(env.OPENAI_API_KEY, undefined);
  assert.equal(env.GH_TOKEN, undefined);
  assert.equal(env.GITHUB_TOKEN, undefined);
});
