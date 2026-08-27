import { extractJsonObject } from './openai-json.js';

export function responsesJsonValue(response: Record<string, unknown>): unknown {
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const value = item as Record<string, unknown>;
    if (value.type === 'function_call' && typeof value.arguments === 'string') {
      return JSON.parse(extractJsonObject(value.arguments));
    }
  }

  if (typeof response.output_text === 'string') {
    return JSON.parse(extractJsonObject(response.output_text));
  }

  const text: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: unknown[] }).content
      : [];
    for (const part of content) {
      if (part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string') {
        text.push((part as { text: string }).text);
      }
    }
  }
  if (text.length === 0) throw new Error('Responses API returned neither function arguments nor text output');
  return JSON.parse(extractJsonObject(text.join('')));
}

export function responsesFunctionTool(name: string, schema: unknown): Record<string, unknown> {
  return {
    type: 'function',
    name,
    description: 'Return the validated structured documentation object.',
    strict: true,
    parameters: schema,
  };
}

export function responsesFunctionChoice(name: string): Record<string, string> {
  return { type: 'function', name };
}
