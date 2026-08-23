import test from 'node:test';
import assert from 'node:assert/strict';
import { checkpointBranch, resolvePullRequestIdentity } from '../../scripts/lib/pr-identity.js';

const sha = 'd'.repeat(40);
const branch = `docs/checkpoint-${sha}`;

test('checkpoint branch identity always uses the full SHA', () => {
  assert.equal(checkpointBranch(sha), branch);
  assert.throws(() => checkpointBranch('short'));
});

test('one lifetime PR is created, updated, reopened, or treated as merged terminal', () => {
  assert.deepEqual(resolvePullRequestIdentity(sha, []), { action: 'create', branch });
  assert.deepEqual(resolvePullRequestIdentity(sha, [{ number: 4, state: 'OPEN', mergedAt: null, headRefName: branch }]), { action: 'update', branch, number: 4 });
  assert.deepEqual(resolvePullRequestIdentity(sha, [{ number: 4, state: 'CLOSED', mergedAt: null, headRefName: branch }]), { action: 'reopen', branch, number: 4 });
  assert.deepEqual(resolvePullRequestIdentity(sha, [{ number: 4, state: 'CLOSED', mergedAt: '2026-08-25T00:00:00Z', headRefName: branch }]), { action: 'terminal', branch, number: 4 });
});

test('duplicate PR identity fails closed', () => {
  const item = { number: 4, state: 'OPEN' as const, mergedAt: null, headRefName: branch };
  assert.throws(() => resolvePullRequestIdentity(sha, [item, { ...item, number: 5 }]));
});
