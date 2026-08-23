import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIDE_ALLOWLIST, assertGuideTarget } from './lib/allowlist.js';
import { applyGuideSection, type GuidePatch } from './lib/guide-patch.js';
import { assertNoSensitiveValues } from './lib/sensitive-data.js';

const updateFile = process.argv[2];
if (!updateFile) throw new Error('usage: tsx scripts/apply-guide-update.ts <guide-update.json>');
const update = JSON.parse(await readFile(updateFile, 'utf8')) as GuidePatch;
if (typeof update.target !== 'string' || typeof update.replacementMarkdown !== 'string') throw new Error('invalid guide update artifact');
assertNoSensitiveValues(update as unknown as Record<string, unknown>, 'guide-update.json');
const target = assertGuideTarget(update.target)!;
const [relativeFile] = GUIDE_ALLOWLIST[target].split('#', 2) as [string, string];
const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/content/docs');
const file = path.resolve(docsRoot, relativeFile);
if (!file.startsWith(`${docsRoot}${path.sep}`)) throw new Error('allowlisted guide path escaped documentation root');
const source = await readFile(file, 'utf8');
await writeFile(file, applyGuideSection(source, update), 'utf8');
