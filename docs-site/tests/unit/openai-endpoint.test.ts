import test from 'node:test';
import assert from 'node:assert/strict';
import { chatCompletionsEndpoint, responsesEndpoint } from '../../scripts/lib/openai-endpoint.js';

test('Responses endpoint defaults to OpenAI and appends the endpoint exactly once', () => {
  assert.equal(responsesEndpoint(undefined), 'https://api.openai.com/v1/responses');
  assert.equal(responsesEndpoint('https://example.com/v1'), 'https://example.com/v1/responses');
  assert.equal(responsesEndpoint('https://example.com/v1/'), 'https://example.com/v1/responses');
  assert.equal(responsesEndpoint('https://example.com/openai/v1/responses'), 'https://example.com/openai/v1/responses');
  assert.equal(responsesEndpoint('https://example.com/openai/v1/chat/completions'), 'https://example.com/openai/v1/responses');
});

test('Chat Completions endpoint shares safe base normalization', () => {
  assert.equal(chatCompletionsEndpoint(undefined), 'https://api.openai.com/v1/chat/completions');
  assert.equal(chatCompletionsEndpoint('https://example.com/v1'), 'https://example.com/v1/chat/completions');
  assert.equal(chatCompletionsEndpoint('https://example.com/v1/responses'), 'https://example.com/v1/chat/completions');
  assert.equal(chatCompletionsEndpoint('https://example.com/v1/chat/completions'), 'https://example.com/v1/chat/completions');
});

test('Responses endpoint rejects unsafe or ambiguous base URLs', () => {
  for (const value of [
    'http://example.com/v1',
    'https://user:pass@example.com/v1',
    'https://example.com/v1?token=secret',
    'https://example.com/v1#fragment',
    '/v1',
    'not-a-url',
  ]) {
    assert.throws(() => responsesEndpoint(value));
  }
});
