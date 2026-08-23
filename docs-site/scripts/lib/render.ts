import type { Corpus } from './corpus.js';
import type { SearchSource } from './providers.js';
import type { CheckpointMetadata } from './trailers.js';
import { assertFullSha, assertSlug } from './identity.js';
import { assertGuideTarget } from './allowlist.js';
import { validateGuideReplacement } from './guide-patch.js';
import { generationOutputSchema, type GenerationOutput } from './schema.js';
import { verificationEvidenceSchema, type VerificationEvidence } from './verification.js';
import { assertNoSensitiveValues } from './sensitive-data.js';

const OFFICIAL_HOSTS = [
  'docs.astro.build',
  'starlight.astro.build',
  'docs.github.com',
  'platform.openai.com',
  'docs.spring.io',
  'docs.gradle.org',
  'nodejs.org',
  'www.npmjs.com',
] as const;

function isOfficialHost(hostname: string): boolean {
  return OFFICIAL_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

export function validateGeneratedRecord(output: GenerationOutput, metadata: CheckpointMetadata, corpus: Corpus, checkpointDate?: string, sources: readonly SearchSource[] = []): GenerationOutput {
  output = generationOutputSchema.parse(output);
  assertNoSensitiveValues(output as unknown as Record<string, unknown>, 'generated-output.json');
  assertFullSha(output.checkpointSha);
  assertSlug(output.slug);
  if (output.checkpointSha !== corpus.sha) throw new Error('generated checkpoint SHA does not match requested SHA');
  if (checkpointDate !== undefined && output.date !== checkpointDate) throw new Error('generated date does not match immutable checkpoint date');
  if (output.checkpoint !== metadata.checkpoint) throw new Error('Learning-Checkpoint was not preserved verbatim');
  if (output.motivation !== metadata.motivation) throw new Error('Learning-Motivation was not preserved verbatim');
  if (output.outcome !== metadata.outcome) throw new Error('Learning-Outcome was not preserved verbatim');
  const corpusPaths = new Set(corpus.files.map((file) => file.path));
  const searchedUrls = new Set(sources.map((source) => source.url));
  for (const citation of output.citations) {
    if (citation.tier === 'repository' && !corpusPaths.has(citation.path)) throw new Error(`repository citation is outside guarded corpus: ${citation.path}`);
    if (citation.tier !== 'repository') {
      if (!searchedUrls.has(citation.url)) throw new Error('external citation was not returned by SearchProvider');
      const url = new URL(citation.url);
      if (url.protocol !== 'https:') throw new Error('external citations must use HTTPS');
      if (citation.tier === 'official' && !isOfficialHost(url.hostname)) throw new Error(`official citation host is not allowlisted: ${url.hostname}`);
    }
  }
  const requestedTarget = assertGuideTarget(metadata.guide);
  if (output.guideUpdate === null) {
    if (requestedTarget) throw new Error('Learning-Guide requested an update but output omitted it');
  } else if (output.guideUpdate.target !== requestedTarget) {
    throw new Error('guide update must exactly match the author-supplied allowlisted target');
  } else {
    validateGuideReplacement(output.guideUpdate.replacementMarkdown);
  }
  return output;
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function markdownText(value: string): string {
  return value.replace(/([\\`*_{}\[\]()#+.!|>-])/g, '\\$1');
}

export function evolutionFilename(output: GenerationOutput): string {
  return `${output.date}-${output.checkpointSha.slice(0, 8)}-${output.slug}.md`;
}

export function renderEvolutionRecord(output: GenerationOutput, evidence: VerificationEvidence): string {
  output = generationOutputSchema.parse(output);
  evidence = verificationEvidenceSchema.parse(evidence);
  assertNoSensitiveValues(output as unknown as Record<string, unknown>, 'render-input.json');
  assertNoSensitiveValues(evidence as unknown as Record<string, unknown>, 'verification-evidence.json');
  if (evidence.checkpointSha !== output.checkpointSha) throw new Error('verification evidence does not belong to this Evolution Record');
  const citations = output.citations.map((citation) => citation.tier === 'repository'
    ? `- [\`${citation.path}\`](https://github.com/zxbdzh/zxb-ai-agent/blob/${output.checkpointSha}/${citation.path.split('/').map(encodeURIComponent).join('/')})（repository）：${markdownText(citation.note)}`
    : `- [${markdownText(citation.title)}](${citation.url})（${citation.tier}）：${markdownText(citation.note)}`).join('\n');
  const guide = output.guideUpdate ? `- \`${output.guideUpdate.target}\`` : '- 无';
  const evidenceFile = `checkpoint-verification-${output.checkpointSha}.json`;
  const verifiedLines = evidence.checks.map((item) => `- 已通过：\`${item.command}\`；[版本化 evidence](https://github.com/zxbdzh/zxb-ai-agent/blob/master/docs-site/public/evidence/${evidenceFile})；[GitHub Actions run](${evidence.runUrl})；临时 artifact：\`${evidence.artifactName}\``).join('\n');
  const verifiedIds = new Set<string>(evidence.checks.map((item) => item.id));
  const unexecutedSuggestions = output.suggestedChecks.filter((id) => !verifiedIds.has(id));
  const suggested = unexecutedSuggestions.length === 0 ? '- 无。' : unexecutedSuggestions.map((id) => `- \`${id}\`（建议但未执行）`).join('\n');

  return `---\ntitle: ${yamlString(output.title)}\ndescription: ${yamlString(`学习检查点 ${output.checkpointSha.slice(0, 8)}`)}\ndocType: evolution-record\ncheckpointSha: ${output.checkpointSha}\ncheckpointDate: ${output.date}\n---\n\n## 检查点主题\n\n${markdownText(output.checkpoint)}\n\n## 学习动机\n\n${markdownText(output.motivation)}\n\n## 学习结果\n\n${markdownText(output.outcome)}\n\n## 运维影响\n\n${markdownText(output.operationalImpact)}\n\n## 变更说明\n\n${output.changeSummary.map((item) => `- ${markdownText(item)}`).join('\n')}\n\n## 证据\n\n${citations}\n\n## 当前指南更新\n\n${guide}\n\n## 验证证据\n\n${verifiedLines}\n\n### 建议但未执行\n\n${suggested}\n\n## 事实修订说明\n\n当前无修订。事实错误只能追加包含日期、作者、原因和新证据的说明；解释变化需要新的学习检查点。\n`;
}

export function appendFactualRevision(record: string, revision: { date: string; author: string; reason: string; evidence: string }): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(revision.date) || !revision.author.trim() || !revision.reason.trim() || !revision.evidence.trim()) throw new Error('revision note requires date, author, reason, and evidence');
  return `${record.trimEnd()}\n\n### ${revision.date} ${revision.author}\n\n原因：${revision.reason}\n\n证据：${revision.evidence}\n`;
}
