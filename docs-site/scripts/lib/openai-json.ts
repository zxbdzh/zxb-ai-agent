export function extractJsonObject(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(text)?.[1];
  const candidate = fenced?.trim() ?? text.trim();
  try {
    const value = JSON.parse(candidate) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('JSON response must be an object');
    return candidate;
  } catch {
    // Some OpenAI-compatible gateways ignore response formatting and add prose around JSON.
    const start = candidate.indexOf('{');
    if (start < 0) throw new Error('model response does not contain a JSON object');
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < candidate.length; index += 1) {
      const character = candidate[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') { inString = true; continue; }
      if (character === '{') depth += 1;
      if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          const objectText = candidate.slice(start, index + 1);
          const value = JSON.parse(objectText) as unknown;
          if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('JSON response must be an object');
          return objectText;
        }
      }
    }
    throw new Error('model response contains an incomplete JSON object');
  }
}
