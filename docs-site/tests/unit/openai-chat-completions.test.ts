import test from 'node:test';
import assert from 'node:assert/strict';
import { chatCompletionText } from '../../scripts/lib/openai-chat-completions.js';

test('Chat Completions extracts the first assistant message', () => {
  assert.equal(chatCompletionText({ choices: [{ message: { content: '{"ok":true}' } }] }), '{"ok":true}');
});

test('Chat Completions rejects missing or empty assistant output', () => {
  assert.throws(() => chatCompletionText({ choices: [] }));
  assert.throws(() => chatCompletionText({ choices: [{}] }));
  assert.throws(() => chatCompletionText({ choices: [{ message: { content: '   ' } }] }));
});
