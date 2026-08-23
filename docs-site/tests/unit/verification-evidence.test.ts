import test from 'node:test';
import assert from 'node:assert/strict';
import { createVerificationEvidence, verificationEvidenceSchema } from '../../scripts/lib/verification.js';

const sha = 'e'.repeat(40);
const runUrl = 'https://github.com/zxbdzh/zxb-ai-agent/actions/runs/12345';

test('verification evidence binds full SHA, fixed checks, run URL, and artifact identity', () => {
  const evidence = createVerificationEvidence(sha, runUrl);
  assert.equal(evidence.checkpointSha, sha);
  assert.equal(evidence.artifactName, `checkpoint-verification-${sha}`);
  assert.equal(evidence.artifactUrl, `${runUrl}#artifacts`);
  assert.equal(evidence.checks.length, 2);
  assert.ok(evidence.checks.every((check) => check.status === 'passed'));
});

test('verification evidence rejects arbitrary provenance and commands', () => {
  const evidence = createVerificationEvidence(sha, runUrl);
  assert.throws(() => verificationEvidenceSchema.parse({ ...evidence, runUrl: 'https://example.com/run/1' }));
  assert.throws(() => verificationEvidenceSchema.parse({ ...evidence, artifactName: 'other' }));
  assert.throws(() => verificationEvidenceSchema.parse({ ...evidence, artifactUrl: 'https://github.com/zxbdzh/zxb-ai-agent/actions/runs/999#artifacts' }));
  assert.throws(() => verificationEvidenceSchema.parse({ ...evidence, checks: [{ ...evidence.checks[0], command: 'echo forged' }, evidence.checks[1]] }));
  assert.throws(() => verificationEvidenceSchema.parse({ ...evidence, checks: [evidence.checks[0], evidence.checks[0]] }));
});
