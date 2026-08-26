import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createVerificationEvidence } from '../../scripts/lib/verification.js';
import { validateTagStagedOutput } from '../../scripts/lib/tag-staged-output.js';
import { renderTagEvolutionRecord, tagEvolutionFilename } from '../../scripts/lib/tag-render.js';
import type { TagGenerationOutput } from '../../scripts/lib/tag-schema.js';

const targetSha = 'd'.repeat(40);
const baseSha = 'c'.repeat(40);
const generated: TagGenerationOutput = {
  targetSha,
  baseSha,
  tag: 'docs-v1.1.0',
  previousTag: 'docs-v1.0.0',
  date: '2026-08-25',
  slug: 'tag-update',
  title: '版本文档更新',
  operationalImpact: '运行说明已经同步。',
  changeSummary: ['更新应用运行方式。'],
  citations: [{ tier: 'repository', path: 'src/App.java', note: '实现依据' }],
  guideUpdates: [{ target: 'running-the-application#main-application', replacementMarkdown: '应用现在使用新的启动入口。' }],
  suggestedChecks: ['docs-check'],
};

async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tag-staged-output-'));
  await mkdir(path.join(root, 'guide-updates'));
  await mkdir(path.join(root, 'evolution'));
  await mkdir(path.join(root, 'evidence'));
  const evidence = createVerificationEvidence(targetSha, 'https://github.com/zxbdzh/zxb-ai-agent/actions/runs/123');
  const evidenceFile = `${evidence.artifactName}.json`;
  const evolutionFile = tagEvolutionFilename(generated);
  await writeFile(path.join(root, 'tag-record.json'), JSON.stringify(generated));
  await writeFile(path.join(root, 'guide-updates', '01.json'), JSON.stringify(generated.guideUpdates[0]));
  await writeFile(path.join(root, 'evolution', evolutionFile), renderTagEvolutionRecord(generated, evidence));
  await writeFile(path.join(root, 'evidence', evidenceFile), JSON.stringify(evidence));
  await writeFile(path.join(root, 'manifest.json'), JSON.stringify({
    schemaVersion: 1,
    kind: 'documentation-tag',
    targetSha,
    baseSha,
    tag: generated.tag,
    previousTag: generated.previousTag,
    evidenceFile,
    evidenceArtifact: evidence.artifactName,
    evolutionFile,
    guideImpacts: [
      { file: 'setup.md', evidencePaths: ['build.gradle'], changedEvidencePaths: [] },
      { file: 'model-configuration.md', evidencePaths: ['application.yaml'], changedEvidencePaths: [] },
      { file: 'running-the-application.md', evidencePaths: ['src/App.java'], changedEvidencePaths: ['src/App.java'] },
      { file: 'conversation-memory.md', evidencePaths: ['src/Memory.java'], changedEvidencePaths: [] },
      { file: 'verification-and-troubleshooting.md', evidencePaths: ['build.gradle'], changedEvidencePaths: [] },
    ],
    guideUpdateFiles: ['01.json'],
    corpus: { files: 1, bytes: 10, excluded: [] },
  }));
  return root;
}

test('tag staged output accepts one identity-bound record and exact guide artifacts', async () => {
  const result = await validateTagStagedOutput(await fixture(), targetSha);
  assert.equal(result.manifest.tag, 'docs-v1.1.0');
  assert.equal(result.generated.guideUpdates.length, 1);
});

test('tag staged output rejects SHA mismatch, extra files, and changed guide artifacts', async () => {
  const mismatch = await fixture();
  await assert.rejects(() => validateTagStagedOutput(mismatch, 'e'.repeat(40)));
  const extra = await fixture();
  await writeFile(path.join(extra, 'unexpected.txt'), 'data');
  await assert.rejects(() => validateTagStagedOutput(extra, targetSha));
  const changed = await fixture();
  await writeFile(path.join(changed, 'guide-updates', '01.json'), JSON.stringify({ target: generated.guideUpdates[0]!.target, replacementMarkdown: '不同中文内容' }));
  await assert.rejects(() => validateTagStagedOutput(changed, targetSha));
});
