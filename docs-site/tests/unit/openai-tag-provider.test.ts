import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenAITagGenerationProvider } from '../../scripts/lib/openai-tag-responses.js';
import type { TagGenerationOutput } from '../../scripts/lib/tag-schema.js';

const sha = 'a'.repeat(40);
const output: TagGenerationOutput = {
  targetSha: sha,
  baseSha: null,
  tag: 'docs-v1.0.0',
  previousTag: null,
  date: '2026-08-26',
  slug: 'initial-docs',
  title: '初始文档基线',
  operationalImpact: '当前文档已经与代码同步。',
  changeSummary: ['建立当前代码的文档基线。'],
  citations: [{ tier: 'repository', path: 'src/App.java', note: '实现证据' }],
  guideUpdates: [{ target: 'conversation-memory#memory', replacementMarkdown: '当前保留 3 条消息。' }],
  suggestedChecks: ['docs-check'],
};

test('tag provider falls back from non-JSON Responses output to Chat Completions JSON mode', async (context) => {
  const urls: string[] = [];
  const requestBodies: Array<Record<string, unknown>> = [];
  context.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    urls.push(url);
    requestBodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    if (url.endsWith('/responses')) {
      return new Response(JSON.stringify({ output_text: '我将先分析仓库内容，然后生成文档。' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ choices: [{ message: { tool_calls: [{ function: { arguments: JSON.stringify(output) } }] } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  const previousBaseUrl = process.env.OPENAI_BASE_URL;
  process.env.OPENAI_BASE_URL = 'https://example.com/v1';
  try {
    const result = await new OpenAITagGenerationProvider('secret', 'model').generate('prompt', AbortSignal.timeout(1000));
    assert.equal(result.tag, output.tag);
    assert.deepEqual(urls, ['https://example.com/v1/responses', 'https://example.com/v1/chat/completions']);
    assert.equal(requestBodies[0]?.max_output_tokens, 20_000);
    assert.equal(requestBodies[1]?.max_tokens, 20_000);
    const chatBody = requestBodies[1] as {
      tools?: Array<{ function?: { name?: string; strict?: boolean; parameters?: unknown } }>;
      tool_choice?: { function?: { name?: string } };
      parallel_tool_calls?: boolean;
    };
    assert.equal(chatBody.tools?.[0]?.function?.name, 'tag_documentation');
    assert.equal(chatBody.tools?.[0]?.function?.strict, true);
    assert.equal(chatBody.tool_choice?.function?.name, 'tag_documentation');
    assert.equal(chatBody.parallel_tool_calls, false);
  } finally {
    if (previousBaseUrl === undefined) delete process.env.OPENAI_BASE_URL;
    else process.env.OPENAI_BASE_URL = previousBaseUrl;
  }
});
