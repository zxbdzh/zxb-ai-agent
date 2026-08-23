import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { FULL_SHA } from './lib/identity.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/content/docs/evolution');
const seen = new Set<string>();
const errors: string[] = [];

for (const name of (await readdir(root)).filter((entry) => entry !== 'index.md' && entry.endsWith('.md'))) {
  const source = (await readFile(path.join(root, name), 'utf8')).replace(/\r\n?/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) { errors.push(`${name}: missing frontmatter`); continue; }
  const data = YAML.parse(match[1]!) as Record<string, unknown>;
  const sha = data.checkpointSha;
  if (typeof sha !== 'string' || !FULL_SHA.test(sha)) errors.push(`${name}: checkpointSha must be a full SHA`);
  else if (seen.has(sha)) errors.push(`${name}: duplicate checkpoint SHA ${sha}`);
  else seen.add(sha);
  const expectedPrefix = typeof data.checkpointDate === 'string' && typeof sha === 'string' ? `${data.checkpointDate}-${sha.slice(0, 8)}-` : '';
  if (!expectedPrefix || !name.startsWith(expectedPrefix) || !/^\d{4}-\d{2}-\d{2}-[0-9a-f]{8}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(name)) errors.push(`${name}: invalid evolution filename`);
  for (const heading of ['## 学习动机', '## 学习结果', '## 运维影响', '## 变更说明', '## 证据', '## 当前指南更新', '## 验证证据', '## 事实修订说明']) {
    if (!source.includes(`\n${heading}\n`)) errors.push(`${name}: missing section ${heading}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Evolution Record check passed.');
}
