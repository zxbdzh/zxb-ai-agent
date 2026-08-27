import test from 'node:test';
import assert from 'node:assert/strict';
import {
  responsesFunctionChoice,
  responsesFunctionTool,
  responsesJsonValue,
} from '../../scripts/lib/openai-responses-json.js';

test('Responses extracts forced function arguments before assistant text', () => {
  assert.deepEqual(responsesJsonValue({
    output_text: '{"ignored":true}',
    output: [{ type: 'function_call', name: 'structured_output', arguments: '{"ok":true}' }],
  }), { ok: true });
  assert.deepEqual(responsesJsonValue({ output_text: 'prefix {"ok":true} suffix' }), { ok: true });
  assert.deepEqual(responsesJsonValue({
    output: [{ type: 'message', content: [{ type: 'output_text', text: '{"ok":true}' }] }],
  }), { ok: true });
});

test('Responses function tools use the Responses API request shape', () => {
  const schema = { type: 'object', additionalProperties: false };
  assert.deepEqual(responsesFunctionTool('structured_output', schema), {
    type: 'function',
    name: 'structured_output',
    description: 'Return the validated structured documentation object.',
    strict: true,
    parameters: schema,
  });
  assert.deepEqual(responsesFunctionChoice('structured_output'), {
    type: 'function',
    name: 'structured_output',
  });
});

test('Responses rejects missing structured output with bounded metadata only', () => {
  assert.throws(
    () => responsesJsonValue({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [] }),
    /status=incomplete; incomplete_reason=max_output_tokens; output_types=none; function_calls=0; text_chars=0/,
  );
  assert.throws(
    () => responsesJsonValue({
      status: 'completed',
      output_text: 'sensitive plain prose',
      output: [{ type: 'message', content: [{ type: 'output_text', text: 'more sensitive prose' }] }],
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /output_types=message; function_calls=0; text_chars=41/);
      assert.doesNotMatch(error.message, /sensitive plain prose|more sensitive prose/);
      return true;
    },
  );
});
