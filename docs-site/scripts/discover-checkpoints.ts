import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FixedGitRunner } from './lib/command-runner.js';
import { checkpointMatrix, discoverCheckpointShas } from './lib/checkpoint-discovery.js';

const [event, before, after, requestedSha] = process.argv.slice(2);
if (event !== 'push' && event !== 'workflow_dispatch') throw new Error('usage: discover-checkpoints.ts <push|workflow_dispatch> <before> <after> <requested-sha>');
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(siteRoot, '..');
const shas = await discoverCheckpointShas(new FixedGitRunner(), repositoryRoot, { event, before, after, requestedSha });
const matrix = JSON.stringify(checkpointMatrix(shas, event));
const manifest = { schemaVersion: 1, event, shas };
const manifestDirectory = path.resolve(siteRoot, '.checkpoint-request');
await mkdir(manifestDirectory, { recursive: true });
await writeFile(path.join(manifestDirectory, 'checkpoint-request.json'), `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
const output = process.env.GITHUB_OUTPUT;
if (output) await appendFile(output, `has_checkpoints=${shas.length > 0}\nmatrix=${matrix}\n`, 'utf8');
else console.log(matrix);
