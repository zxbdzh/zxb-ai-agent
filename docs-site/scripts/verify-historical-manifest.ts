import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const schema = z.object({
  schemaVersion: z.literal(1),
  entries: z.array(z.object({
    sha: z.string().regex(/^[0-9a-f]{40}$/),
    subject: z.string().regex(/^(feat|fix|refactor|docs|chore|test|build)\([a-z][a-z0-9._\/-]*\):\s+.+$/),
  }).strict()).max(100),
}).strict();

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = schema.parse(JSON.parse(await readFile(path.join(siteRoot, 'data/historical-checkpoints.json'), 'utf8')));
const seen = new Set<string>();
for (const entry of data.entries) {
  if (seen.has(entry.sha)) throw new Error(`duplicate historical SHA: ${entry.sha}`);
  seen.add(entry.sha);
}
console.log('Historical manifest schema passed without inferred intent fields.');
