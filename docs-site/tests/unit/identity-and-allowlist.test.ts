import test from 'node:test';
import assert from 'node:assert/strict';
import { assertFullSha, assertSlug } from '../../scripts/lib/identity.js';
import { assertGuideTarget } from '../../scripts/lib/allowlist.js';

test('identity accepts only conservative values', () => {
  assert.equal(assertFullSha('a'.repeat(40)), 'a'.repeat(40));
  assert.throws(() => assertFullSha('a'.repeat(39)));
  assert.equal(assertSlug('memory-window'), 'memory-window');
  assert.throws(() => assertSlug('../memory'));
});

test('guide target must be an exact page#section allowlist key', () => {
  assert.equal(assertGuideTarget('conversation-memory#lifecycle'), 'conversation-memory#lifecycle');
  assert.throws(() => assertGuideTarget('conversation-memory#unknown'));
  assert.throws(() => assertGuideTarget('../setup#prerequisites'));
});
