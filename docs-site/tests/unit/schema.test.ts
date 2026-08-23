import test from 'node:test';
import assert from 'node:assert/strict';
import { generationJsonSchema, generationOutputSchema } from '../../scripts/lib/schema.js';

const sha = 'a'.repeat(40);
const valid = {
  checkpointSha: sha,
  date: '2026-08-24',
  slug: 'memory-window',
  title: '记忆窗口调整',
  checkpoint: '对话记忆窗口',
  motivation: '作者动机',
  outcome: '作者结果',
  operationalImpact: '运维影响',
  changeSummary: ['将窗口调整为二十条消息。'],
  citations: [{ tier: 'repository', path: 'src/App.java', note: '仓库实现证据' }],
  guideUpdate: null,
  suggestedChecks: [],
};

test('local strict schema enforces Chinese-first generated prose and full identity', () => {
  assert.equal(generationOutputSchema.parse(valid).checkpointSha, sha);
  assert.throws(() => generationOutputSchema.parse({ ...valid, checkpoint: '' }));
  assert.throws(() => generationOutputSchema.parse({ ...valid, title: 'Memory window' }));
  assert.throws(() => generationOutputSchema.parse({ ...valid, changeSummary: ['English only'] }));
  assert.throws(() => generationOutputSchema.parse({ ...valid, checkpointSha: 'short' }));
  assert.throws(() => generationOutputSchema.parse({ ...valid, title: '中文\n## escaped' }));
});

test('provider strict schema uses supported anyOf and no unsupported URI format or oneOf', () => {
  const serialized = JSON.stringify(generationJsonSchema);
  assert.doesNotMatch(serialized, /"oneOf"/);
  assert.doesNotMatch(serialized, /"format":"uri"/);
  assert.match(serialized, /"anyOf"/);
});
