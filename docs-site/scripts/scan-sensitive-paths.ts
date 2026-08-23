import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { assertNoSensitiveData } from './lib/sensitive-data.js';

const siteRoot = path.resolve(import.meta.dirname, '..');
const requested = process.argv.slice(2);
if (requested.length === 0) throw new Error('usage: scan-sensitive-paths.ts <docs-site-relative-path> [...]');

async function scan(target: string): Promise<void> {
  const info = await stat(target);
  if (info.isDirectory()) {
    for (const entry of await readdir(target)) await scan(path.join(target, entry));
    return;
  }
  if (!info.isFile()) throw new Error(`unsupported scan target: ${target}`);
  const bytes = await readFile(target);
  if (bytes.includes(0)) throw new Error(`binary content is not allowed in scanned output: ${path.relative(siteRoot, target)}`);
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  assertNoSensitiveData(text, path.relative(siteRoot, target).replaceAll('\\', '/'));
}

for (const item of requested) {
  const target = path.resolve(siteRoot, item);
  const relative = path.relative(siteRoot, target);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') throw new Error(`scan target escapes docs-site: ${item}`);
  await scan(target);
}
console.log('Sensitive-data output scan passed.');
