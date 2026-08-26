import type { TagGenerationOutput } from './tag-schema.js';
import type { VerificationEvidence } from './verification.js';
import { tagGenerationOutputSchema } from './tag-schema.js';
import { verificationEvidenceSchema } from './verification.js';
import { assertNoSensitiveValues } from './sensitive-data.js';

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function markdownText(value: string): string {
  return value.replace(/([\\`*_{}\[\]()#+.!|>-])/g, '\\$1');
}

export function tagEvolutionFilename(output: TagGenerationOutput): string {
  return `${output.date}-${output.targetSha.slice(0, 8)}-${output.slug}.md`;
}

export function renderTagEvolutionRecord(output: TagGenerationOutput, evidence: VerificationEvidence): string {
  output = tagGenerationOutputSchema.parse(output);
  evidence = verificationEvidenceSchema.parse(evidence);
  assertNoSensitiveValues(output as unknown as Record<string, unknown>, 'tag-render-input.json');
  if (evidence.checkpointSha !== output.targetSha) throw new Error('verification evidence does not belong to the tagged snapshot');
  const citations = output.citations.map((citation) => {
    if (citation.tier !== 'repository') throw new Error('tag records accept repository citations only');
    const encoded = citation.path.split('/').map(encodeURIComponent).join('/');
    return `- [\`${citation.path}\`](https://github.com/zxbdzh/zxb-ai-agent/blob/${output.targetSha}/${encoded})（repository）：${markdownText(citation.note)}`;
  }).join('\n');
  const guideTargets = output.guideUpdates.length === 0 ? '- 无' : output.guideUpdates.map((update) => `- \`${update.target}\``).join('\n');
  const verifiedLines = evidence.checks.map((item) => `- 已通过：\`${item.command}\`；[版本化 evidence](https://github.com/zxbdzh/zxb-ai-agent/blob/master/docs-site/public/evidence/${evidence.artifactName}.json)；[GitHub Actions run](${evidence.runUrl})`).join('\n');
  const verifiedIds = new Set<string>(evidence.checks.map((item) => item.id));
  const suggested = output.suggestedChecks.filter((id) => !verifiedIds.has(id));
  const suggestedLines = suggested.length === 0 ? '- 无。' : suggested.map((id) => `- \`${id}\`（建议但未执行）`).join('\n');
  const range = output.previousTag ? `\`${output.previousTag}\` 到 \`${output.tag}\`` : `首次文档基线 \`${output.tag}\``;

  return `---\ntitle: ${yamlString(output.title)}\ndescription: ${yamlString(`文档版本 ${output.tag}`)}\ndocType: evolution-record\ncheckpointSha: ${output.targetSha}\ncheckpointDate: ${output.date}\n---\n\n## 检查点主题\n\n${markdownText(`文档版本 ${output.tag}`)}\n\n## 学习动机\n\n通过推送文档 Tag，自动沉淀这一批代码的事实变化，避免手工维护 Wiki。\n\n## 学习结果\n\n已根据 ${range} 的受限仓库语料生成 Wiki 更新候选，并经过固定 CI 验证。\n\n## 运维影响\n\n${markdownText(output.operationalImpact)}\n\n## 变更说明\n\n${output.changeSummary.map((item) => `- ${markdownText(item)}`).join('\n')}\n\n## 证据\n\n${citations}\n\n## 当前指南更新\n\n${guideTargets}\n\n## 验证证据\n\n${verifiedLines}\n\n### 建议但未执行\n\n${suggestedLines}\n\n## 事实修订说明\n\n当前无修订。事实错误只能追加包含日期、作者、原因和新证据的说明；解释变化需要新的文档 Tag。\n`;
}
