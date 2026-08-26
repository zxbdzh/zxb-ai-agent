import { z } from 'zod';
import { FULL_SHA, SLUG } from './identity.js';

export const DOCS_TAG = /^docs-v[0-9]+(?:\.[0-9]+){2}(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/;

const containsChinese = (value: string): boolean => /[\u4E00-\u9FFF]/.test(value);
const chineseLine = z.string().min(1).refine((value) => !/[\r\n]/.test(value), 'value must be one line').refine(containsChinese, 'generated prose must contain Chinese');
const chineseMarkdown = z.string().min(1).refine(containsChinese, 'generated Markdown must contain Chinese');
const repositoryCitationSchema = z.object({
  tier: z.literal('repository'),
  path: z.string().min(1),
  note: chineseLine,
}).strict();

export const tagGenerationOutputSchema = z.object({
  targetSha: z.string().regex(FULL_SHA),
  baseSha: z.string().regex(FULL_SHA).nullable(),
  tag: z.string().regex(DOCS_TAG),
  previousTag: z.string().regex(DOCS_TAG).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slug: z.string().regex(SLUG).max(64),
  title: chineseLine.max(100),
  operationalImpact: chineseLine,
  changeSummary: z.array(chineseLine).min(1).max(12),
  citations: z.array(repositoryCitationSchema).min(1).max(20),
  guideUpdates: z.array(z.object({
    target: z.string().min(1),
    replacementMarkdown: chineseMarkdown.max(12000),
  }).strict()).max(11),
  suggestedChecks: z.array(z.enum(['docs-check', 'docs-build', 'gradle-style', 'gradle-build-no-tests'])).max(4),
}).strict();

export type TagGenerationOutput = z.infer<typeof tagGenerationOutputSchema>;

const chineseString = { type: 'string', minLength: 1, pattern: '[\\u4E00-\\u9FFF]' } as const;
const tagPattern = '^docs-v[0-9]+(?:\\.[0-9]+){2}(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$';

export const tagGenerationJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['targetSha', 'baseSha', 'tag', 'previousTag', 'date', 'slug', 'title', 'operationalImpact', 'changeSummary', 'citations', 'guideUpdates', 'suggestedChecks'],
  properties: {
    targetSha: { type: 'string', pattern: '^[0-9a-f]{40}$' },
    baseSha: { anyOf: [{ type: 'null' }, { type: 'string', pattern: '^[0-9a-f]{40}$' }] },
    tag: { type: 'string', pattern: tagPattern },
    previousTag: { anyOf: [{ type: 'null' }, { type: 'string', pattern: tagPattern }] },
    date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 64 },
    title: { ...chineseString, maxLength: 100 },
    operationalImpact: chineseString,
    changeSummary: { type: 'array', minItems: 1, maxItems: 12, items: chineseString },
    citations: {
      type: 'array', minItems: 1, maxItems: 20,
      items: { type: 'object', additionalProperties: false, required: ['tier', 'path', 'note'], properties: { tier: { type: 'string', const: 'repository' }, path: { type: 'string', minLength: 1 }, note: chineseString } },
    },
    guideUpdates: {
      type: 'array', maxItems: 11,
      items: { type: 'object', additionalProperties: false, required: ['target', 'replacementMarkdown'], properties: { target: { type: 'string', minLength: 1 }, replacementMarkdown: { ...chineseString, maxLength: 12000 } } },
    },
    suggestedChecks: { type: 'array', maxItems: 4, items: { type: 'string', enum: ['docs-check', 'docs-build', 'gradle-style', 'gradle-build-no-tests'] } },
  },
} as const;

export function assertDocsTag(value: string): string {
  if (!DOCS_TAG.test(value)) throw new Error('tag must match docs-vMAJOR.MINOR.PATCH with an optional prerelease suffix');
  return value;
}
