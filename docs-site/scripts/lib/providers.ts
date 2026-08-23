export interface SearchSource {
  url: string;
  title: string;
  excerpt: string;
}

export interface SearchProvider {
  search(query: string, signal: AbortSignal): Promise<readonly SearchSource[]>;
}

export interface GenerationProvider {
  generate(input: string, signal: AbortSignal): Promise<unknown>;
}

export class NoSearchProvider implements SearchProvider {
  async search(): Promise<readonly SearchSource[]> {
    return [];
  }
}
