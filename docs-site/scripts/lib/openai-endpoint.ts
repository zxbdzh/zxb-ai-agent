const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

export function responsesEndpoint(baseUrl = process.env.OPENAI_BASE_URL): string {
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
  const normalizedPath = url.pathname.replace(/\/+$/, '');
  url.pathname = normalizedPath.endsWith('/responses') ? normalizedPath : `${normalizedPath}/responses`;
  return url.toString();
}
