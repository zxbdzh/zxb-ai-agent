import test from 'node:test';
import assert from 'node:assert/strict';
import { chatCompletionJson, chatCompletionJsonValue } from '../../scripts/lib/openai-chat-completions.js';

test('Chat Completions extracts forced tool arguments before assistant content', () => {
  assert.deepEqual(chatCompletionJsonValue({
    choices: [{ message: { content: 'ignored', tool_calls: [{ function: { arguments: '{"ok":true}' } }] } }],
  }), { ok: true });
  assert.deepEqual(chatCompletionJsonValue({ choices: [{ message: { content: '{"ok":true}' } }] }), { ok: true });
});

test('Chat Completions disables reasoning when forcing tools for GPT-5.6 compatibility', async (context) => {
  let requestBody: Record<string, unknown> | undefined;
  context.mock.method(globalThis, 'fetch', async (_input: string | URL | Request, init?: RequestInit) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({
      choices: [{ message: { tool_calls: [{ function: { arguments: '{"ok":true}' } }] } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  const previousBaseUrl = process.env.OPENAI_BASE_URL;
  process.env.OPENAI_BASE_URL = 'https://example.com/v1';
  try {
    assert.deepEqual(await chatCompletionJson(
      'secret',
      'gpt-5.6-terra',
      'instruction',
      'input',
      'structured_output',
      { type: 'object' },
      AbortSignal.timeout(1000),
    ), { ok: true });
    assert.equal(requestBody?.reasoning_effort, 'none');
  } finally {
    if (previousBaseUrl === undefined) delete process.env.OPENAI_BASE_URL;
    else process.env.OPENAI_BASE_URL = previousBaseUrl;
  }
});

test('Chat Completions rejects missing structured output with bounded metadata only', () => {
  assert.throws(() => chatCompletionJsonValue({ choices: [] }), /choices=0; finish_reason=unknown; tool_calls=0; content_chars=0/);
  assert.throws(() => chatCompletionJsonValue({ choices: [{}] }), /choices=1; finish_reason=unknown; tool_calls=0; content_chars=0/);
  assert.throws(
    () => chatCompletionJsonValue({
      choices: [{ finish_reason: 'stop', message: { content: 'sensitive plain prose' } }],
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /choices=1; finish_reason=stop; tool_calls=0; content_chars=21/);
      assert.doesNotMatch(error.message, /sensitive plain prose/);
      return true;
    },
  );
});
