const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

function validatedBaseUrl(baseUrl = process.env.OPENAI_BASE_URL): URL {
  const raw = baseUrl?.trim() || DEFAULT_OPENAI_BASE_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('OPENAI_BASE_URL must be an absolute HTTPS URL');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('OPENAI_BASE_URL must be HTTPS without credentials, query, or fragment');
  }
  url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/(?:responses|chat\/completions)$/, '');
  return url;
}

export function responsesEndpoint(baseUrl = process.env.OPENAI_BASE_URL): string {
  const url = validatedBaseUrl(baseUrl);
  url.pathname = `${url.pathname}/responses`;
  return url.toString();
}

export function chatCompletionsEndpoint(baseUrl = process.env.OPENAI_BASE_URL): string {
  const url = validatedBaseUrl(baseUrl);
  url.pathname = `${url.pathname}/chat/completions`;
  return url.toString();
}
