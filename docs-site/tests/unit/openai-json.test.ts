import test from 'node:test';
import assert from 'node:assert/strict';
import { extractJsonObject } from '../../scripts/lib/openai-json.js';

test('JSON extraction accepts plain, fenced, and prose-wrapped objects', () => {
  const object = '{"title":"中文","nested":{"text":"花括号 { 保留"}}';
  assert.equal(extractJsonObject(object), object);
  assert.equal(extractJsonObject(`说明文字\n\n${object}\n\n结束说明`), object);
  assert.equal(extractJsonObject(`\`\`\`json\n${object}\n\`\`\``), object);
  const quoted = JSON.stringify(object);
  assert.equal(extractJsonObject(quoted), object);
});

test('JSON extraction keeps Markdown fences inside JSON string values', () => {
  const object = JSON.stringify({
    replacementMarkdown: '说明。\n\n```java\nMessageWindowChatMemory.builder().maxMessages(3).build();\n```',
    nested: { ok: true },
  });
  assert.equal(extractJsonObject(object), object);
  assert.equal(extractJsonObject(`前置说明\n${object}\n结束说明`), object);
});

test('JSON extraction ignores braces inside strings and rejects incomplete output', () => {
  const object = '{"text":"quoted } brace"}';
  assert.equal(extractJsonObject(`模型说明：${object}`), object);
  assert.throws(() => extractJsonObject('模型只返回中文说明，没有 JSON'));
  assert.throws(() => extractJsonObject('前置 {"text":"未闭合"'));
});
