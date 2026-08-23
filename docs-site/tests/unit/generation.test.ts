import test from 'node:test';
import assert from 'node:assert/strict';
import type { GenerationProvider } from '../../scripts/lib/providers.js';
import { generateWithRepairs } from '../../scripts/lib/generation.js';

class InvalidProvider implements GenerationProvider {
  calls = 0;
  async generate(): Promise<unknown> { this.calls += 1; return { invalid: true }; }
}

test('generation performs at most two schema repair attempts', async () => {
  const provider = new InvalidProvider();
  await assert.rejects(() => generateWithRepairs(provider, 'bounded input'));
  assert.equal(provider.calls, 3);
});
