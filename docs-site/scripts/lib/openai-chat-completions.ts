import { chatCompletionsEndpoint } from './openai-endpoint.js';
import { extractJsonObject } from './openai-json.js';

function argumentShape(value: unknown): string {
  if (typeof value !== 'string') return value === null ? 'null' : typeof value;
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'empty';
  if (trimmed.startsWith('{')) return 'object';
  if (trimmed.startsWith('[')) return 'array';
  if (trimmed.startsWith('"')) return 'quoted';
  return 'other';
}

export function chatCompletionJsonValue(response: Record<string, unknown>, expectedToolName?: string): unknown {
  const choices = Array.isArray(response.choices) ? response.choices : [];
  try {
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
      if (fn && typeof fn === 'object') {
        const argumentsValue = (fn as { arguments?: unknown }).arguments;
        if (typeof argumentsValue === 'string') return JSON.parse(extractJsonObject(argumentsValue));
        if (argumentsValue && typeof argumentsValue === 'object' && !Array.isArray(argumentsValue)) return argumentsValue;
      }
    }
    const content = (message as { content?: unknown }).content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('Chat Completions API returned neither tool arguments nor text output');
    }
    return JSON.parse(extractJsonObject(content));
  } catch (error) {
    const first = choices[0];
    const choice = first && typeof first === 'object' ? first as Record<string, unknown> : {};
    const message = choice.message && typeof choice.message === 'object'
      ? choice.message as Record<string, unknown>
      : {};
    const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
    const firstToolCall = toolCalls[0];
    const fn = firstToolCall && typeof firstToolCall === 'object'
      && (firstToolCall as { function?: unknown }).function
      && typeof (firstToolCall as { function: unknown }).function === 'object'
      ? (firstToolCall as { function: Record<string, unknown> }).function
      : {};
    const functionNameMatches = expectedToolName === undefined
      ? 'unknown'
      : String(fn.name === expectedToolName);
    const argumentsValue = fn.arguments;
    const argumentsChars = typeof argumentsValue === 'string' ? argumentsValue.length : 0;
    const contentChars = typeof message.content === 'string' ? message.content.length : 0;
    const finishReason = typeof choice.finish_reason === 'string' ? choice.finish_reason : 'unknown';
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(`Chat Completions structured output invalid: choices=${choices.length}; finish_reason=${finishReason}; tool_calls=${toolCalls.length}; function_name_matches=${functionNameMatches}; arguments_type=${argumentsValue === null ? 'null' : typeof argumentsValue}; arguments_chars=${argumentsChars}; arguments_shape=${argumentShape(argumentsValue)}; content_chars=${contentChars}; cause=${cause}`);
  }
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
  return chatCompletionJsonValue(body, toolName);
}
