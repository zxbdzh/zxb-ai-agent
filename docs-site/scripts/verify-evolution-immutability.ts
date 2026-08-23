import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FixedGitRunner } from './lib/command-runner.js';
import { assertFullSha } from './lib/identity.js';

const rawBase = process.env.EVOLUTION_BASE_SHA?.trim();
if (!rawBase || /^0{40}$/.test(rawBase)) {
  console.log('Evolution immutability check skipped: no comparison base was supplied.');
  process.exit(0);
}
const base = assertFullSha(rawBase);
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(siteRoot, '..');
const evolutionRoot = path.join(siteRoot, 'src/content/docs/evolution');
const repositoryPrefix = 'docs-site/src/content/docs/evolution/';
const runner = new FixedGitRunner();
const listing = await runner.run(['git', 'ls-tree', '-r', '-z', '--name-only', base, '--', repositoryPrefix], { cwd: repositoryRoot });
if (listing.exitCode !== 0) throw new Error('unable to list Evolution Records at comparison base');
const paths = listing.stdout.toString('utf8').split('\0').filter((entry) => entry.endsWith('.md') && !entry.endsWith('/index.md'));
const revisionBlock = /\n\n### \d{4}-\d{2}-\d{2} .+\n\n原因：[^\n]+\n\n证据：[^\n]+\n?$/;

for (const repositoryPath of paths) {
  const oldResult = await runner.run(['git', 'show', `${base}:${repositoryPath}`], { cwd: repositoryRoot });
  if (oldResult.exitCode !== 0) throw new Error(`unable to read prior Evolution Record: ${repositoryPath}`);
  const oldText = oldResult.stdout.toString('utf8').replace(/\r\n?/g, '\n');
  const localPath = path.join(evolutionRoot, repositoryPath.slice(repositoryPrefix.length));
  let newText: string;
  try {
    newText = (await readFile(localPath, 'utf8')).replace(/\r\n?/g, '\n');
  } catch {
    throw new Error(`existing Evolution Record was deleted or renamed: ${repositoryPath}`);
  }
  if (newText === oldText) continue;
  if (!newText.startsWith(oldText.trimEnd())) throw new Error(`existing Evolution Record interpretation was modified: ${repositoryPath}`);
  const appended = newText.slice(oldText.trimEnd().length);
  if (!revisionBlock.test(appended)) throw new Error(`Evolution Record changes must be append-only attributed factual revision notes: ${repositoryPath}`);
}
console.log('Existing Evolution Records are unchanged or contain append-only factual revision notes.');
