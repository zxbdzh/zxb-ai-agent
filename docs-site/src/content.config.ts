import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const contentFields = z.object({
  docType: z.enum(['current-guide', 'evolution-record', 'evolution-index', 'reference', 'automation']),
  verifiedAgainst: z.string().regex(/^[0-9a-f]{40}$/).optional(),
  verifiedAt: z.coerce.date().optional(),
  evidencePaths: z.array(z.string().min(1)).optional(),
  verificationCommands: z.array(z.string().min(1)).optional(),
  checkpointSha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
  checkpointDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).superRefine((data, context) => {
  if (data.docType === 'current-guide') {
    for (const key of ['verifiedAgainst', 'verifiedAt', 'evidencePaths', 'verificationCommands'] as const) {
      const value = data[key];
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        context.addIssue({ code: 'custom', path: [key], message: `${key} is required for Current Guides` });
      }
    }
  }
  if (data.docType === 'evolution-record') {
    for (const key of ['checkpointSha', 'checkpointDate'] as const) {
      if (data[key] === undefined) context.addIssue({ code: 'custom', path: [key], message: `${key} is required for Evolution Records` });
    }
  }
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({ extend: contentFields }),
  }),
};
