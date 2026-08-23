import { z } from 'zod';
import { FULL_SHA, SLUG } from './identity.js';

const containsChinese = (value: string): boolean => /[\u4E00-\u9FFF]/.test(value);
const singleLine = z.string().min(1).refine((value) => !/[\r\n]/.test(value), 'value must be one line');
const chineseLine = singleLine.refine(containsChinese, 'generated prose must contain Chinese');
const chineseMarkdown = z.string().min(1).refine(containsChinese, 'generated Markdown must contain Chinese');

export const citationSchema = z.discriminatedUnion('tier', [
  z.object({ tier: z.literal('repository'), path: z.string().min(1), note: chineseLine }).strict(),
  z.object({ tier: z.literal('official'), url: z.string().url(), title: singleLine, note: chineseLine }).strict(),
  z.object({ tier: z.literal('secondary'), url: z.string().url(), title: singleLine, note: chineseLine }).strict(),
]);

export const generationOutputSchema = z.object({
  checkpointSha: z.string().regex(FULL_SHA),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slug: z.string().regex(SLUG).max(64),
  title: chineseLine.max(100),
  checkpoint: singleLine,
  motivation: singleLine,
  outcome: singleLine,
  operationalImpact: chineseLine,
  changeSummary: z.array(chineseLine).min(1).max(8),
  citations: z.array(citationSchema).min(1).max(20),
  guideUpdate: z.object({
    target: z.string().min(1),
    replacementMarkdown: chineseMarkdown.max(12000),
  }).strict().nullable(),
  suggestedChecks: z.array(z.enum(['docs-check', 'docs-build', 'gradle-style', 'gradle-build-no-tests'])).max(4),
}).strict();

export type GenerationOutput = z.infer<typeof generationOutputSchema>;

// Keep the provider schema within the documented Structured Outputs subset.
// URL, newline, citation-host, and exact identity checks are enforced locally after generation.
const chineseString = { type: 'string', minLength: 1, pattern: '[\\u4E00-\\u9FFF]' } as const;

export const generationJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['checkpointSha', 'date', 'slug', 'title', 'checkpoint', 'motivation', 'outcome', 'operationalImpact', 'changeSummary', 'citations', 'guideUpdate', 'suggestedChecks'],
  properties: {
    checkpointSha: { type: 'string', pattern: '^[0-9a-f]{40}$' },
    date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 64 },
    title: { ...chineseString, maxLength: 100 },
    checkpoint: { type: 'string', minLength: 1 },
    motivation: { type: 'string', minLength: 1 },
    outcome: { type: 'string', minLength: 1 },
    operationalImpact: chineseString,
    changeSummary: { type: 'array', minItems: 1, maxItems: 8, items: chineseString },
    citations: {
      type: 'array', minItems: 1, maxItems: 20,
      items: {
        anyOf: [
          { type: 'object', additionalProperties: false, required: ['tier', 'path', 'note'], properties: { tier: { type: 'string', const: 'repository' }, path: { type: 'string', minLength: 1 }, note: chineseString } },
          { type: 'object', additionalProperties: false, required: ['tier', 'url', 'title', 'note'], properties: { tier: { type: 'string', enum: ['official', 'secondary'] }, url: { type: 'string', minLength: 1 }, title: { type: 'string', minLength: 1 }, note: chineseString } },
        ],
      },
    },
    guideUpdate: {
      anyOf: [
        { type: 'null' },
        { type: 'object', additionalProperties: false, required: ['target', 'replacementMarkdown'], properties: { target: { type: 'string', minLength: 1 }, replacementMarkdown: { ...chineseString, maxLength: 12000 } } },
      ],
    },
    suggestedChecks: { type: 'array', maxItems: 4, items: { type: 'string', enum: ['docs-check', 'docs-build', 'gradle-style', 'gradle-build-no-tests'] } },
  },
} as const;
