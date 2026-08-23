import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { FixedGitRunner } from './lib/command-runner.js';
import { checkpointMatrix, discoverCheckpointShas } from './lib/checkpoint-discovery.js';
import { assertNoSensitiveValues } from './lib/sensitive-data.js';

const requestFile = process.argv[2];
if (!requestFile) throw new Error('usage: consume-checkpoint-request.ts <checkpoint-request.json>');
const schema = z.object({
  schemaVersion: z.literal(1),
  event: z.enum(['push', 'workflow_dispatch']),
  shas: z.array(z.string().regex(/^[0-9a-f]{40}$/)).max(1000),
}).strict();
const request = schema.parse(JSON.parse(await readFile(requestFile, 'utf8')));
assertNoSensitiveValues(request, 'checkpoint-request.json');
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(siteRoot, '..');
const runner = new FixedGitRunner();
const validated: string[] = [];
for (const sha of request.shas) {
  validated.push(...await discoverCheckpointShas(runner, repositoryRoot, { event: 'workflow_dispatch', requestedSha: sha }));
}
const shas = [...new Set(validated)];
const output = process.env.GITHUB_OUTPUT;
const values = `has_checkpoints=${shas.length > 0}\nmatrix=${JSON.stringify(checkpointMatrix(shas, request.event))}\n`;
if (output) await appendFile(output, values, 'utf8');
else console.log(values);
