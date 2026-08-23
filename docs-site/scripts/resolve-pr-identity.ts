import { appendFile, readFile } from 'node:fs/promises';
import { z } from 'zod';
import { assertFullSha } from './lib/identity.js';
import { resolvePullRequestIdentity } from './lib/pr-identity.js';

const sha = assertFullSha(process.argv[2] ?? '');
const file = process.argv[3];
if (!file) throw new Error('usage: resolve-pr-identity.ts <full-sha> <pr-list.json>');
const schema = z.array(z.object({
  number: z.number().int().positive(),
  state: z.enum(['OPEN', 'CLOSED']),
  mergedAt: z.string().nullable(),
  headRefName: z.string(),
}).strict()).max(10);
const decision = resolvePullRequestIdentity(sha, schema.parse(JSON.parse(await readFile(file, 'utf8'))));
const output = process.env.GITHUB_OUTPUT;
const values = `action=${decision.action}\nbranch=${decision.branch}\nnumber=${'number' in decision ? decision.number : ''}\n`;
if (output) await appendFile(output, values, 'utf8');
else console.log(values);
