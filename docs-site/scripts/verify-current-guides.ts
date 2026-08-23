import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { FixedGitRunner } from './lib/command-runner.js';
import { FULL_SHA } from './lib/identity.js';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(siteRoot, '..');
const currentRoot = path.join(siteRoot, 'src/content/docs/current');
const expected = new Set([
  'setup.md',
  'model-configuration.md',
  'running-the-application.md',
  'conversation-memory.md',
  'verification-and-troubleshooting.md',
]);
const runner = new FixedGitRunner();
const errors: string[] = [];

function frontmatter(source: string): Record<string, unknown> {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(source.replace(/\r\n?/g, '\n'));
  if (!match) throw new Error('missing YAML frontmatter');
  return YAML.parse(match[1]!) as Record<string, unknown>;
}

const files = (await readdir(currentRoot)).filter((name) => name.endsWith('.md'));
for (const missing of [...expected].filter((name) => !files.includes(name))) errors.push(`missing Current Guide route: ${missing}`);
for (const extra of files.filter((name) => !expected.has(name))) errors.push(`unexpected Current Guide route: ${extra}`);

for (const name of [...expected].filter((entry) => files.includes(entry))) {
  try {
    const data = frontmatter(await readFile(path.join(currentRoot, name), 'utf8'));
    if (data.docType !== 'current-guide') throw new Error('docType must be current-guide');
    if (typeof data.verifiedAgainst !== 'string' || !FULL_SHA.test(data.verifiedAgainst)) throw new Error('verifiedAgainst must be a full SHA');
    if (!(typeof data.verifiedAt === 'string' || data.verifiedAt instanceof Date)) throw new Error('verifiedAt is required');
    if (!Array.isArray(data.evidencePaths) || data.evidencePaths.length === 0 || data.evidencePaths.some((item) => typeof item !== 'string' || !item || path.isAbsolute(item) || item.includes('\\') || item.split('/').includes('..'))) throw new Error('evidencePaths must be safe nonempty repository paths');
    if (!Array.isArray(data.verificationCommands) || data.verificationCommands.length === 0 || data.verificationCommands.some((item) => typeof item !== 'string' || !item)) throw new Error('verificationCommands must be nonempty strings');
    const committedDiff = await runner.run(['git', 'diff', `${data.verifiedAgainst}..HEAD`, '--', ...data.evidencePaths as string[]], { cwd: repositoryRoot });
    if (committedDiff.exitCode !== 0) throw new Error('committed git diff failed');
    if (committedDiff.stdout.length > 0) throw new Error(`stale: committed evidence changed after ${data.verifiedAgainst}`);
    const workingDiff = await runner.run(['git', 'diff', 'HEAD', '--', ...data.evidencePaths as string[]], { cwd: repositoryRoot });
    if (workingDiff.exitCode !== 0) throw new Error('working-tree git diff failed');
    if (workingDiff.stdout.length > 0) throw new Error('stale: staged or unstaged evidence changes are not verified');
  } catch (error) {
    errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Exactly five Current Guides are complete and fresh.');
}
