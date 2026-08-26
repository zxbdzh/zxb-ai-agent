import { chatCompletionsEndpoint } from './openai-endpoint.js';
import { extractJsonObject } from './openai-json.js';

export function chatCompletionText(response: Record<string, unknown>): string {
  const choices = Array.isArray(response.choices) ? response.choices : [];
  const first = choices[0];
  if (!first || typeof first !== 'object') throw new Error('Chat Completions API returned no choices');
  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== 'object') throw new Error('Chat Completions API returned no message');
  const content = (message as { content?: unknown }).content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Chat Completions API returned no text output');
  }
  return content;
}

export async function chatCompletionJson(
  apiKey: string,
  model: string,
  developerInstruction: string,
  input: string,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetch(chatCompletionsEndpoint(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: 20_000,
      messages: [
        { role: 'system', content: developerInstruction },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
    }),
    signal,
  });
  if (!response.ok) throw new Error(`OpenAI Chat Completions API failed with HTTP ${response.status}`);
  const body = await response.json() as Record<string, unknown>;
  return JSON.parse(extractJsonObject(chatCompletionText(body)));
}
