import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStagedOutput } from './lib/staged-output.js';
import { assertNoSensitiveData } from './lib/sensitive-data.js';

const staging = process.argv[2];
if (!staging) throw new Error('usage: publish-staged-output.ts <docs-site-relative-directory>');
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stagingRoot = path.resolve(siteRoot, staging);
const relative = path.relative(siteRoot, stagingRoot);
if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') throw new Error('staging directory escapes docs-site');
const untrustedManifest = JSON.parse(await readFile(path.join(stagingRoot, 'manifest.json'), 'utf8')) as { sha?: unknown };
if (typeof untrustedManifest.sha !== 'string') throw new Error('staged manifest is missing SHA identity');
const manifest = await validateStagedOutput(stagingRoot, untrustedManifest.sha);
const destinationRoot = path.join(siteRoot, 'src/content/docs/evolution');
const evidenceRoot = path.join(siteRoot, 'public/evidence');
await mkdir(destinationRoot, { recursive: true });
await mkdir(evidenceRoot, { recursive: true });
await copyFile(path.join(stagingRoot, 'evolution', manifest.evolutionFile), path.join(destinationRoot, manifest.evolutionFile));
await copyFile(path.join(stagingRoot, 'evidence', manifest.evidenceFile), path.join(evidenceRoot, manifest.evidenceFile));

const prBody = `本 PR 由受信任的学习检查点自动化生成，等待人工审查。\n\n- 检查点：\`${manifest.sha}\`\n- 演进记录：\`${manifest.evolutionFile}\`\n- 当前指南目标：\`${manifest.guideTarget ?? '无'}\`\n- 版本化 evidence：\`docs-site/public/evidence/${manifest.evidenceFile}\`\n- 临时传递 artifact：\`${manifest.evidenceArtifact}\`\n\n模型输出仅作为候选文档；合并即表示审查者确认引用、事实和指南更新。\n`;
assertNoSensitiveData(prBody, 'pr-body.md');
await writeFile(path.join(stagingRoot, 'pr-body.md'), prBody, 'utf8');
