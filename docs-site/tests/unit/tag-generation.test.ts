import test from 'node:test';
import assert from 'node:assert/strict';
import { tagGenerationJsonSchema, tagGenerationOutputSchema, assertDocsTag, type TagGenerationOutput } from '../../scripts/lib/tag-schema.js';
import { tagGenerationPrompt, validateTagGeneratedOutput, generateTagWithRepairs, type GuideImpact } from '../../scripts/lib/tag-generation.js';
import type { GenerationProvider } from '../../scripts/lib/providers.js';
import { renderTagEvolutionRecord, tagEvolutionFilename } from '../../scripts/lib/tag-render.js';
import { createVerificationEvidence } from '../../scripts/lib/verification.js';
import { GUIDE_TARGETS } from '../../scripts/lib/allowlist.js';
import YAML from 'yaml';

const targetSha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);
const identity = { targetSha, baseSha, tag: 'docs-v1.2.3', previousTag: 'docs-v1.2.2', date: '2026-08-25' };
const corpus = { sha: targetSha, totalBytes: 20, excluded: [], files: [{ path: 'src/App.java', text: 'class App {}' }] };
const output: TagGenerationOutput = {
  ...identity,
  slug: 'tag-release',
  title: '文档版本更新',
  operationalImpact: '当前运行方式已经同步更新。',
  changeSummary: ['应用入口发生变化。'],
  citations: [{ tier: 'repository', path: 'src/App.java', note: '目标版本实现证据' }],
  guideUpdates: [
    { target: 'running-the-application#main-application', replacementMarkdown: '应用现在通过新的入口启动。' },
    { target: 'verification-and-troubleshooting#common-problems', replacementMarkdown: '遇到启动失败时检查入口配置。' },
  ],
  suggestedChecks: ['docs-check'],
};

test('documentation tags use the explicit semantic tag namespace', () => {
  assert.equal(assertDocsTag('docs-v1.2.3'), 'docs-v1.2.3');
  assert.equal(assertDocsTag('docs-v2.0.0-rc.1'), 'docs-v2.0.0-rc.1');
  for (const value of ['v1.2.3', 'docs-v1', 'docs-v1.2', 'docs-v1.2.3/escape']) assert.throws(() => assertDocsTag(value));
});

test('tag generation validates immutable identity, repository citations, and unique allowlisted guide targets', () => {
  assert.equal(validateTagGeneratedOutput(output, identity, corpus).guideUpdates.length, 2);
  assert.throws(() => validateTagGeneratedOutput({ ...output, targetSha: 'c'.repeat(40) }, identity, corpus));
  assert.throws(() => validateTagGeneratedOutput({ ...output, citations: [{ tier: 'repository', path: '../secret', note: '越界引用' }] }, identity, corpus));
  assert.throws(() => validateTagGeneratedOutput({ ...output, guideUpdates: [output.guideUpdates[0]!, output.guideUpdates[0]!] }, identity, corpus));
  assert.throws(() => validateTagGeneratedOutput({ ...output, guideUpdates: [{ target: 'not-allowlisted', replacementMarkdown: '中文内容' }] } as unknown as TagGenerationOutput, identity, corpus));
  assert.throws(() => validateTagGeneratedOutput({ ...output, guideUpdates: [] }, identity, corpus, [{ file: 'running-the-application.md', evidencePaths: ['src/App.java'], changedEvidencePaths: ['src/App.java'] }]));
  assert.doesNotThrow(() => validateTagGeneratedOutput(output, identity, corpus, [{ file: 'running-the-application.md', evidencePaths: ['src/App.java'], changedEvidencePaths: ['src/App.java'] }]));
});

test('tag prompt binds range identity and exposes only allowlisted guide sections', () => {
  const guideImpacts: GuideImpact[] = [
    { file: 'running-the-application.md', evidencePaths: ['src/App.java'], changedEvidencePaths: ['src/App.java'] },
  ];
  const prompt = JSON.parse(tagGenerationPrompt({ identity, corpus, corpusText: 'corpus', diffText: 'diff', guideImpacts })) as Record<string, unknown>;
  assert.deepEqual(prompt.identity, identity);
  assert.equal(prompt.changedRange, 'diff');
  assert.deepEqual(prompt.currentGuideEvidenceImpact, guideImpacts);
  assert.match(JSON.stringify(prompt), /conversation-memory#memory/);
  assert.deepEqual((prompt.constraints as { output: { schema: unknown } }).output.schema, tagGenerationJsonSchema);
});

test('tag generation strengthens retry prompts after provider parse failures', async () => {
  const inputs: string[] = [];
  let attempt = 0;
  const provider: GenerationProvider = {
    async generate(input) {
      inputs.push(input);
      attempt += 1;
      if (attempt < 3) throw new Error('model response does not contain a JSON object');
      return output;
    },
  };
  assert.equal((await generateTagWithRepairs(provider, 'original prompt')).tag, output.tag);
  assert.equal(inputs.length, 3);
  assert.equal(inputs[0], 'original prompt');
  assert.match(inputs[1]!, /Return exactly one JSON object/);
  assert.match(inputs[1]!, /does not contain a JSON object/);
});

test('tag generation retries trusted semantic validation failures without weakening guide boundaries', async () => {
  const inputs: string[] = [];
  let attempt = 0;
  const invalidReplacement = '不得泄漏的非法正文\n\n## 同级章节';
  const provider: GenerationProvider = {
    async generate(input) {
      inputs.push(input);
      attempt += 1;
      return attempt === 1
        ? { ...output, guideUpdates: [{ target: 'running-the-application#main-application', replacementMarkdown: invalidReplacement }] }
        : output;
    },
  };
  const generated = await generateTagWithRepairs(
    provider,
    'original prompt',
    (candidate) => validateTagGeneratedOutput(candidate, identity, corpus),
  );
  assert.deepEqual(generated, output);
  assert.equal(inputs.length, 2);
  assert.match(inputs[1]!, /failed trusted semantic validation/);
  assert.match(inputs[1]!, /cannot create page metadata or peer sections/);
  assert.doesNotMatch(inputs[1]!, /不得泄漏的非法正文/);
});

test('tag generation exhausts its finite repair budget on repeated semantic failures', async () => {
  let attempts = 0;
  const provider: GenerationProvider = {
    async generate() {
      attempts += 1;
      return output;
    },
  };
  await assert.rejects(
    generateTagWithRepairs(provider, 'original prompt', () => {
      throw new Error('semantic boundary failed');
    }),
    /semantic boundary failed/,
  );
  assert.equal(attempts, 3);
});

test('tag Evolution Record is deterministic and evidence-bound', () => {
  const evidence = createVerificationEvidence(targetSha, 'https://github.com/zxbdzh/zxb-ai-agent/actions/runs/123');
  assert.equal(tagEvolutionFilename(output), `2026-08-25-${targetSha.slice(0, 8)}-tag-release.md`);
  const markdown = renderTagEvolutionRecord(output, evidence);
  assert.match(markdown, /docs-v1\.2\.2/);
  assert.match(markdown, /docs-v1\.2\.3/);
  assert.match(markdown, /running-the-application#main-application/);
  assert.match(markdown, new RegExp(targetSha));
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(markdown);
  assert.ok(frontmatter);
  const parsed = YAML.parse(frontmatter[1]!) as Record<string, unknown>;
  assert.equal(parsed.checkpointDate, output.date);
  assert.equal(typeof parsed.checkpointDate, 'string');
});

test('OpenAI structured schema constrains guide targets to the runtime allowlist', () => {
  const guideUpdates = tagGenerationJsonSchema.properties.guideUpdates;
  assert.deepEqual(guideUpdates.items.properties.target.enum, GUIDE_TARGETS);
  assert.throws(() => tagGenerationOutputSchema.parse({
    ...output,
    guideUpdates: [{ target: 'current/setup.md#前提', replacementMarkdown: '中文内容' }],
  }));
});

test('OpenAI structured schema remains strict and declares all required tag fields', () => {
  assert.equal(tagGenerationJsonSchema.additionalProperties, false);
  assert.equal(tagGenerationOutputSchema.parse(output).tag, 'docs-v1.2.3');
});
