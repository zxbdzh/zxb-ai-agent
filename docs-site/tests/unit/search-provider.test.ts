import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedSearch } from '../../scripts/lib/generation.js';
import type { SearchProvider, SearchSource } from '../../scripts/lib/providers.js';

class FixtureSearch implements SearchProvider {
  calls = 0;
  constructor(private readonly sources: readonly SearchSource[]) {}
  async search(): Promise<readonly SearchSource[]> { this.calls += 1; return this.sources; }
}

test('search orchestration enforces finite query and source limits', async () => {
  const provider = new FixtureSearch(Array.from({ length: 10 }, (_, index) => ({ url: `https://example.com/${index}`, title: `Source ${index}`, excerpt: '中文摘录' })));
  assert.equal((await boundedSearch(provider, ['one', 'two'])).length, 8);
  assert.ok(provider.calls <= 2);
  await assert.rejects(() => boundedSearch(provider, ['one', 'two', 'three']));
});
