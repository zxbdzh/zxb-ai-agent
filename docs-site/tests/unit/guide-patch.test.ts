import test from 'node:test';
import assert from 'node:assert/strict';
import { applyGuideSection } from '../../scripts/lib/guide-patch.js';

const source = `---\ntitle: Guide\ndocType: current-guide\nverifiedAgainst: ${'a'.repeat(40)}\n---\n\n# Guide\n\n## 对话记忆\n\n旧内容\n\n### 旧子节\n\n旧子节内容\n\n## 生命周期\n\n旧生命周期\n\n## 尾部\n\n保持不变\n`;
const patch = { target: 'conversation-memory#lifecycle', replacementMarkdown: '新的中文生命周期说明。\n\n### 细节\n\n仍在目标节内。' };

test('guide patch changes only the exact allowlisted section body', () => {
  const result = applyGuideSection(source, patch);
  assert.match(result, /## 对话记忆\n\n旧内容/);
  assert.match(result, /## 生命周期\n\n新的中文生命周期说明/);
  assert.match(result, /## 尾部\n\n保持不变/);
  assert.match(result, new RegExp(`verifiedAgainst: ${'a'.repeat(40)}`));
});

test('guide patch is idempotent for the same checkpoint identity and content', () => {
  const once = applyGuideSection(source, patch);
  assert.equal(applyGuideSection(once, patch), once);
});

test('guide patch rejects peer headings at the beginning or later in replacement', () => {
  assert.throws(() => applyGuideSection(source, { ...patch, replacementMarkdown: '## Escape\nbody' }));
  assert.throws(() => applyGuideSection(source, { ...patch, replacementMarkdown: 'body\n\n## Escape' }));
  assert.throws(() => applyGuideSection(source, { ...patch, replacementMarkdown: '# New page' }));
});

test('guide patch rejects unknown and ambiguous targets', () => {
  assert.throws(() => applyGuideSection(source, { target: 'conversation-memory#unknown', replacementMarkdown: '中文' }));
  assert.throws(() => applyGuideSection(`${source}\n## 生命周期\n重复`, patch));
});
