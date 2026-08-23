import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createVerificationEvidence } from '../../scripts/lib/verification.js';
import { validateStagedOutput } from '../../scripts/lib/staged-output.js';

const sha = 'f'.repeat(40);
const filename = `2026-08-24-${sha.slice(0, 8)}-record.md`;

async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'staged-output-'));
  await mkdir(path.join(root, 'evolution'));
  await mkdir(path.join(root, 'evidence'));
  await writeFile(path.join(root, 'evolution', filename), `---\ntitle: 记录\ndocType: evolution-record\ncheckpointSha: ${sha}\ncheckpointDate: 2026-08-24\n---\n\n中文正文\n`);
  const evidenceFile = `checkpoint-verification-${sha}.json`;
  await writeFile(path.join(root, 'evidence', evidenceFile), JSON.stringify(createVerificationEvidence(sha, 'https://github.com/zxbdzh/zxb-ai-agent/actions/runs/123')));
  await writeFile(path.join(root, 'manifest.json'), JSON.stringify({ schemaVersion: 1, sha, event: 'push', evolutionFile: filename, evidenceFile, guideTarget: null, evidenceArtifact: `checkpoint-verification-${sha}`, corpus: { files: 1, bytes: 10, excluded: [] } }));
  return root;
}

test('staged output accepts exactly one identity-bound record', async () => {
  assert.equal((await validateStagedOutput(await fixture(), sha)).evolutionFile, filename);
});

test('staged output rejects SHA mismatch, undeclared files, and sensitive content', async () => {
  const mismatch = await fixture();
  await assert.rejects(() => validateStagedOutput(mismatch, 'a'.repeat(40)));
  const extra = await fixture();
  await writeFile(path.join(extra, 'unexpected.txt'), 'data');
  await assert.rejects(() => validateStagedOutput(extra, sha));
  const sensitive = await fixture();
  await writeFile(path.join(sensitive, 'evolution', filename), `checkpointSha: ${sha}\n密钥 sk-${'x'.repeat(30)}`);
  await assert.rejects(() => validateStagedOutput(sensitive, sha));
});

test('staged guide update requires exact target and exact bounded artifact keys', async () => {
  const root = await fixture();
  const manifest = { schemaVersion: 1, sha, event: 'push', evolutionFile: filename, evidenceFile: `checkpoint-verification-${sha}.json`, guideTarget: 'conversation-memory#lifecycle', evidenceArtifact: `checkpoint-verification-${sha}`, corpus: { files: 1, bytes: 10, excluded: [] } };
  await writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest));
  await writeFile(path.join(root, 'guide-update.json'), JSON.stringify({ target: manifest.guideTarget, replacementMarkdown: '中文更新内容' }));
  assert.equal((await validateStagedOutput(root, sha)).guideTarget, manifest.guideTarget);
  await writeFile(path.join(root, 'guide-update.json'), JSON.stringify({ target: manifest.guideTarget, replacementMarkdown: '中文', path: '../escape' }));
  await assert.rejects(() => validateStagedOutput(root, sha));
});
