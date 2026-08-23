import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFactualRevision, evolutionFilename, renderEvolutionRecord, validateGeneratedRecord } from '../../scripts/lib/render.js';
import type { GenerationOutput } from '../../scripts/lib/schema.js';
import { createVerificationEvidence } from '../../scripts/lib/verification.js';

const sha = 'b'.repeat(40);
const output: GenerationOutput = {
  checkpointSha: sha,
  date: '2026-08-24',
  slug: 'memory-window',
  title: '记忆窗口调整',
  checkpoint: '对话记忆窗口',
  motivation: '原始动机',
  outcome: '原始结果',
  operationalImpact: '原始影响',
  changeSummary: ['窗口改为 20 条消息。'],
  citations: [{ tier: 'repository', path: 'src/App.java', note: '实现证据' }],
  guideUpdate: { target: 'conversation-memory#lifecycle', replacementMarkdown: '更新中文内容' },
  suggestedChecks: ['docs-check'],
};
const corpus = { sha, totalBytes: 10, excluded: [], files: [{ path: 'src/App.java', text: 'code' }] };
const metadata = { checkpoint: '对话记忆窗口', motivation: '原始动机', outcome: '原始结果', guide: 'conversation-memory#lifecycle' };
const evidence = createVerificationEvidence(sha, 'https://github.com/zxbdzh/zxb-ai-agent/actions/runs/123');

test('generated identity, verbatim fields, citations, and guide target are validated', () => {
  assert.equal(validateGeneratedRecord(output, metadata, corpus, '2026-08-24').slug, 'memory-window');
  assert.throws(() => validateGeneratedRecord({ ...output, checkpoint: '模型改写主题' }, metadata, corpus));
  assert.throws(() => validateGeneratedRecord({ ...output, motivation: '模型改写' }, metadata, corpus));
  assert.throws(() => validateGeneratedRecord({ ...output, citations: [{ tier: 'repository', path: '../secret', note: '越界证据' }] }, metadata, corpus));
});

test('official citations require allowlisted HTTPS primary hosts while secondary citations remain labeled', () => {
  const officialSource = { url: 'https://docs.gradle.org/current/userguide/userguide.html', title: 'Gradle', excerpt: '官方资料' };
  assert.doesNotThrow(() => validateGeneratedRecord({ ...output, citations: [{ tier: 'official', url: officialSource.url, title: 'Gradle', note: '官方证据' }] }, metadata, corpus, undefined, [officialSource]));
  assert.throws(() => validateGeneratedRecord({ ...output, citations: [{ tier: 'official', url: 'https://docs.gradle.org/current/userguide/other.html', title: 'Gradle', note: '未搜索证据' }] }, metadata, corpus, undefined, [officialSource]));
  assert.throws(() => validateGeneratedRecord({ ...output, citations: [{ tier: 'official', url: 'https://example.com/docs', title: 'Example', note: '伪官方证据' }] }, metadata, corpus));
  const secondarySource = { url: 'https://example.com/post', title: 'Post', excerpt: '社区经验' };
  assert.throws(() => validateGeneratedRecord({ ...output, citations: [{ tier: 'secondary', url: 'http://example.com/post', title: 'Post', note: '次级证据' }] }, metadata, corpus, undefined, [{ ...secondarySource, url: 'http://example.com/post' }]));
  assert.doesNotThrow(() => validateGeneratedRecord({ ...output, citations: [{ tier: 'secondary', url: secondarySource.url, title: 'Post', note: '次级证据' }] }, metadata, corpus, undefined, [secondarySource]));
});

test('renderer derives deterministic filename and requires durable matching CI evidence', () => {
  assert.equal(evolutionFilename(output), `2026-08-24-${sha.slice(0, 8)}-memory-window.md`);
  const markdown = renderEvolutionRecord(output, evidence);
  assert.match(markdown, /检查点主题/);
  assert.match(markdown, /对话记忆窗口/);
  assert.match(markdown, /版本化 evidence/);
  assert.match(markdown, new RegExp(`public/evidence/checkpoint-verification-${sha}\\.json`));
  assert.match(markdown, /GitHub Actions run/);
  assert.match(markdown, new RegExp(`checkpoint-verification-${sha}`));
  assert.match(markdown, /`docs-check`（建议但未执行）/);
  assert.throws(() => renderEvolutionRecord(output, createVerificationEvidence('c'.repeat(40), 'https://github.com/zxbdzh/zxb-ai-agent/actions/runs/456')));
});

test('factual revision notes require attribution and evidence', () => {
  assert.match(appendFactualRevision('record\n', { date: '2026-08-25', author: '维护者', reason: '事实错误', evidence: 'src/App.java' }), /2026-08-25 维护者/);
  assert.throws(() => appendFactualRevision('record', { date: 'bad', author: '', reason: '', evidence: '' }));
});
