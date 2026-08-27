import { extractJsonObject } from './openai-json.js';

export function responsesJsonValue(response: Record<string, unknown>): unknown {
  const output = Array.isArray(response.output) ? response.output : [];
  try {
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
  } catch (error) {
    const status = typeof response.status === 'string' ? response.status : 'unknown';
    const incompleteDetails = response.incomplete_details;
    const incompleteReason = incompleteDetails && typeof incompleteDetails === 'object'
      && typeof (incompleteDetails as { reason?: unknown }).reason === 'string'
      ? (incompleteDetails as { reason: string }).reason
      : 'none';
    const outputTypes = [...new Set(output.map((item) => item && typeof item === 'object'
      && typeof (item as { type?: unknown }).type === 'string'
      ? (item as { type: string }).type
      : 'unknown'))].slice(0, 5).join(',') || 'none';
    const functionCalls = output.filter((item) => item && typeof item === 'object'
      && (item as { type?: unknown }).type === 'function_call').length;
    const outputTextChars = typeof response.output_text === 'string' ? response.output_text.length : 0;
    const messageTextChars = output.reduce<number>((total, item) => {
      if (!item || typeof item !== 'object') return total;
      const content = Array.isArray((item as { content?: unknown }).content)
        ? (item as { content: unknown[] }).content
        : [];
      return total + content.reduce<number>((itemTotal, part) => itemTotal + (part && typeof part === 'object'
        && typeof (part as { text?: unknown }).text === 'string'
        ? (part as { text: string }).text.length
        : 0), 0);
    }, 0);
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(`Responses API structured output invalid: status=${status}; incomplete_reason=${incompleteReason}; output_types=${outputTypes}; function_calls=${functionCalls}; text_chars=${outputTextChars + messageTextChars}; cause=${cause}`);
  }
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
