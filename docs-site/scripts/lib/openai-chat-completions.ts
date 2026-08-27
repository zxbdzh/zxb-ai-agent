import { chatCompletionsEndpoint } from './openai-endpoint.js';
import { extractJsonObject } from './openai-json.js';

export function chatCompletionJsonValue(response: Record<string, unknown>): unknown {
  const choices = Array.isArray(response.choices) ? response.choices : [];
  const first = choices[0];
  if (!first || typeof first !== 'object') throw new Error('Chat Completions API returned no choices');
  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== 'object') throw new Error('Chat Completions API returned no message');
  const toolCalls = Array.isArray((message as { tool_calls?: unknown }).tool_calls)
    ? (message as { tool_calls: unknown[] }).tool_calls
    : [];
  const firstToolCall = toolCalls[0];
  if (firstToolCall && typeof firstToolCall === 'object') {
    const fn = (firstToolCall as { function?: unknown }).function;
    if (fn && typeof fn === 'object' && typeof (fn as { arguments?: unknown }).arguments === 'string') {
      return JSON.parse(extractJsonObject((fn as { arguments: string }).arguments));
    }
  }
  const content = (message as { content?: unknown }).content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Chat Completions API returned neither tool arguments nor text output');
  }
  return JSON.parse(extractJsonObject(content));
}

export async function chatCompletionJson(
  apiKey: string,
  model: string,
  developerInstruction: string,
  input: string,
  toolName: string,
  schema: unknown,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetch(chatCompletionsEndpoint(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      reasoning_effort: 'none',
      max_tokens: 20_000,
      messages: [
        { role: 'system', content: developerInstruction },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
      tools: [{
        type: 'function',
        function: {
          name: toolName,
          description: 'Return the validated structured documentation object.',
          strict: true,
          parameters: schema,
        },
      }],
      tool_choice: { type: 'function', function: { name: toolName } },
      parallel_tool_calls: false,
    }),
    signal,
  });
  if (!response.ok) throw new Error(`OpenAI Chat Completions API failed with HTTP ${response.status}`);
  const body = await response.json() as Record<string, unknown>;
  return chatCompletionJsonValue(body);
}
