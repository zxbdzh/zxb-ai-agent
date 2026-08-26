import test from 'node:test';
import assert from 'node:assert/strict';
import { chatCompletionJsonValue } from '../../scripts/lib/openai-chat-completions.js';

test('Chat Completions extracts forced tool arguments before assistant content', () => {
  assert.deepEqual(chatCompletionJsonValue({
    choices: [{ message: { content: 'ignored', tool_calls: [{ function: { arguments: '{"ok":true}' } }] } }],
  }), { ok: true });
  assert.deepEqual(chatCompletionJsonValue({ choices: [{ message: { content: '{"ok":true}' } }] }), { ok: true });
});

test('Chat Completions rejects missing or empty structured output', () => {
  assert.throws(() => chatCompletionJsonValue({ choices: [] }));
  assert.throws(() => chatCompletionJsonValue({ choices: [{}] }));
  assert.throws(() => chatCompletionJsonValue({ choices: [{ message: { content: '   ' } }] }));
});
