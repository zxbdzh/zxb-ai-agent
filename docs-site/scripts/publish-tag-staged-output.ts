import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { GUIDE_ALLOWLIST, assertGuideTarget } from './lib/allowlist.js';
import { applyGuideSection } from './lib/guide-patch.js';
import { validateTagStagedOutput } from './lib/tag-staged-output.js';
import { assertNoSensitiveData } from './lib/sensitive-data.js';
import { FixedGitRunner } from './lib/command-runner.js';
import { buildCorpus, TAG_CORPUS_OPTIONS } from './lib/corpus.js';
import { validateTagGeneratedOutput } from './lib/tag-generation.js';

const staging = process.argv[2];
if (!staging) throw new Error('usage: publish-tag-staged-output.ts <docs-site-relative-directory>');
const siteRoot = path.resolve(import.meta.dirname, '..');
const repositoryRoot = path.resolve(siteRoot, '..');
const stagingRoot = path.resolve(siteRoot, staging);
const relative = path.relative(siteRoot, stagingRoot);
if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') throw new Error('tag staging directory escapes docs-site');
const rawManifest = JSON.parse(await readFile(path.join(stagingRoot, 'manifest.json'), 'utf8')) as { targetSha?: unknown };
if (typeof rawManifest.targetSha !== 'string') throw new Error('tag manifest is missing target SHA');
const { manifest, generated } = await validateTagStagedOutput(stagingRoot, rawManifest.targetSha);
const corpus = await buildCorpus(new FixedGitRunner(), repositoryRoot, manifest.targetSha, TAG_CORPUS_OPTIONS);
validateTagGeneratedOutput(generated, {
  targetSha: manifest.targetSha,
  baseSha: manifest.baseSha,
  tag: manifest.tag,
  previousTag: manifest.previousTag,
  date: generated.date,
}, corpus, manifest.guideImpacts);

const currentRoot = path.join(siteRoot, 'src/content/docs/current');
const changedFiles = new Set<string>();
for (const update of generated.guideUpdates) {
  const target = assertGuideTarget(update.target)!;
  const [relativeFile] = GUIDE_ALLOWLIST[target].split('#', 2) as [string, string];
  const filename = relativeFile.replace(/^current\//, '');
  const file = path.resolve(currentRoot, filename);
  if (!file.startsWith(`${currentRoot}${path.sep}`)) throw new Error('allowlisted guide path escaped current guide root');
  const source = await readFile(file, 'utf8');
  await writeFile(file, applyGuideSection(source, update), 'utf8');
}

const expectedGuideFiles = new Set(manifest.guideImpacts.map((impact) => impact.file));
for (const filename of expectedGuideFiles) {
  const file = path.join(currentRoot, filename);
  const source = (await readFile(file, 'utf8')).replace(/\r\n?/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) throw new Error(`Current Guide is missing frontmatter: ${filename}`);
  const data = YAML.parse(match[1]!) as Record<string, unknown>;
  data.verifiedAgainst = manifest.targetSha;
  data.verifiedAt = generated.date;
  const updatedFrontmatter = YAML.stringify(data, { lineWidth: 0 }).trimEnd();
  await writeFile(file, `---\n${updatedFrontmatter}\n---\n${source.slice(match[0].length)}`, 'utf8');
  changedFiles.add(filename);
}

const evolutionRoot = path.join(siteRoot, 'src/content/docs/evolution');
const evidenceRoot = path.join(siteRoot, 'public/evidence');
await mkdir(evolutionRoot, { recursive: true });
await mkdir(evidenceRoot, { recursive: true });
await copyFile(path.join(stagingRoot, 'evolution', manifest.evolutionFile), path.join(evolutionRoot, manifest.evolutionFile));
await copyFile(path.join(stagingRoot, 'evidence', manifest.evidenceFile), path.join(evidenceRoot, manifest.evidenceFile));

const baseLabel = manifest.previousTag ?? '首次文档基线';
const guideList = generated.guideUpdates.length === 0 ? '- 无 Current Guide 变更' : generated.guideUpdates.map((update) => `- \`${update.target}\``).join('\n');
const summary = generated.changeSummary.map((item) => `- ${item}`).join('\n');
const prBody = `本 PR 由 \`${manifest.tag}\` 自动触发，AI 根据受限仓库语料生成，并将在完整文档 CI 通过后自动 squash 合并。\n\n- 比较基线：\`${baseLabel}\`\n- 目标 Tag：\`${manifest.tag}\`\n- 目标 SHA：\`${manifest.targetSha}\`\n- 版本化 evidence：\`docs-site/public/evidence/${manifest.evidenceFile}\`\n\n## 变更摘要\n\n${summary}\n\n## Current Guide 更新\n\n${guideList}\n\n模型没有写权限，且不能决定验证基线；本 PR 中的 SHA、日期和 evidence 由可信脚本写入。\n`;
assertNoSensitiveData(prBody, 'tag-pr-body.md');
await writeFile(path.join(stagingRoot, 'pr-body.md'), prBody, 'utf8');

const changedList = [...changedFiles].map((name) => `docs-site/src/content/docs/current/${name}`);
await writeFile(path.join(stagingRoot, 'changed-files.txt'), `${[`docs-site/src/content/docs/evolution/${manifest.evolutionFile}`, ...changedList, `docs-site/public/evidence/${manifest.evidenceFile}`].join('\n')}\n`, 'utf8');
