import test from 'node:test';
import assert from 'node:assert/strict';
import { chatCompletionJson, chatCompletionJsonValue } from '../../scripts/lib/openai-chat-completions.js';

test('Chat Completions extracts forced tool arguments before assistant content', () => {
  assert.deepEqual(chatCompletionJsonValue({
    choices: [{ message: { content: 'ignored', tool_calls: [{ function: { arguments: '{"ok":true}' } }] } }],
  }), { ok: true });
  assert.deepEqual(chatCompletionJsonValue({ choices: [{ message: { tool_calls: [{ function: { arguments: { ok: true } } }] } }] }), { ok: true });
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
  assert.throws(() => chatCompletionJsonValue({ choices: [] }), /choices=0; finish_reason=unknown; tool_calls=0; function_name_matches=unknown; arguments_type=undefined; arguments_chars=0; arguments_shape=undefined; content_chars=0/);
  assert.throws(() => chatCompletionJsonValue({ choices: [{}] }), /choices=1; finish_reason=unknown; tool_calls=0; function_name_matches=unknown; arguments_type=undefined; arguments_chars=0; arguments_shape=undefined; content_chars=0/);
  assert.throws(
    () => chatCompletionJsonValue({
      choices: [{ finish_reason: 'stop', message: { content: 'sensitive plain prose' } }],
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /choices=1; finish_reason=stop; tool_calls=0; function_name_matches=unknown; arguments_type=undefined; arguments_chars=0; arguments_shape=undefined; content_chars=21/);
      assert.doesNotMatch(error.message, /sensitive plain prose/);
      return true;
    },
  );
  assert.throws(
    () => chatCompletionJsonValue({
      choices: [{
        finish_reason: 'tool_calls',
        message: { content: null, tool_calls: [{ function: { name: 'structured_output', arguments: 'sensitive prose' } }] },
      }],
    }, 'structured_output'),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /finish_reason=tool_calls; tool_calls=1; function_name_matches=true; arguments_type=string; arguments_chars=15; arguments_shape=other; content_chars=0/);
      assert.doesNotMatch(error.message, /sensitive prose/);
      return true;
    },
  );
});
