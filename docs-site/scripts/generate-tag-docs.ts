import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertFullSha } from './lib/identity.js';
import { assertNoSensitiveData, assertNoSensitiveValues } from './lib/sensitive-data.js';
import { FixedGitRunner } from './lib/command-runner.js';
import { buildCorpus, serializeCorpus, TAG_CORPUS_OPTIONS } from './lib/corpus.js';
import { OpenAITagGenerationProvider } from './lib/openai-tag-responses.js';
import { generateTagWithRepairs, tagGenerationPrompt, validateTagGeneratedOutput, type GuideImpact, type TagGenerationIdentity } from './lib/tag-generation.js';
import { assertDocsTag } from './lib/tag-schema.js';
import { readVerificationEvidence } from './lib/evidence-reader.js';
import { renderTagEvolutionRecord, tagEvolutionFilename } from './lib/tag-render.js';
import YAML from 'yaml';

function args(argv: readonly string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) throw new Error('arguments must be --name value pairs');
    result[key.slice(2)] = value;
  }
  return result;
}

const options = args(process.argv.slice(2));
const targetSha = assertFullSha(options.sha ?? '');
const tag = assertDocsTag(options.tag ?? '');
const baseSha = options['base-sha'] === 'none' ? null : assertFullSha(options['base-sha'] ?? '');
const previousTag = options['previous-tag'] === 'none' ? null : assertDocsTag(options['previous-tag'] ?? '');
if ((baseSha === null) !== (previousTag === null)) throw new Error('base SHA and previous tag must both be present or both be absent');
const evidenceInput = options.evidence;
if (!evidenceInput) throw new Error('--evidence is required');
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(siteRoot, '..');
const outputRoot = path.resolve(siteRoot, options.output ?? '.generated-tag');
const relativeOutput = path.relative(siteRoot, outputRoot);
if (relativeOutput.startsWith('..') || path.isAbsolute(relativeOutput) || relativeOutput === '') throw new Error('output must be a docs-site-relative staging directory');

const runner = new FixedGitRunner();
const tagShaResult = await runner.run(['git', 'rev-list', '-n', '1', tag], { cwd: repositoryRoot });
if (tagShaResult.exitCode !== 0 || tagShaResult.stdout.toString('ascii').trim() !== targetSha) throw new Error('tag does not resolve to requested target SHA');
if (baseSha !== null && previousTag !== null) {
  const previousResult = await runner.run(['git', 'rev-list', '-n', '1', previousTag], { cwd: repositoryRoot });
  if (previousResult.exitCode !== 0 || previousResult.stdout.toString('ascii').trim() !== baseSha) throw new Error('previous tag does not resolve to requested base SHA');
  const ancestor = await runner.run(['git', 'merge-base', '--is-ancestor', baseSha, targetSha], { cwd: repositoryRoot });
  if (ancestor.exitCode !== 0) throw new Error('previous documentation tag is not an ancestor of the target tag');
}
const dateResult = await runner.run(['git', 'show', '-s', '--format=%cs', targetSha], { cwd: repositoryRoot });
if (dateResult.exitCode !== 0) throw new Error('unable to read tagged commit date');
const date = dateResult.stdout.toString('utf8').trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('tagged commit date is not deterministic yyyy-mm-dd');
let diffText: string;
if (baseSha === null) {
  diffText = 'FIRST_DOCUMENTATION_TAG_BASELINE: inspect the complete target snapshot corpus.';
} else {
  const diffExclusions = [
    ':(exclude)docs-site/src/content/docs/**',
    ':(exclude)docs-site/public/evidence/**',
  ];
  const diffResult = await runner.run(['git', 'diff', '--find-renames', '--find-copies', '--no-ext-diff', `${baseSha}..${targetSha}`, '--', '.', ...diffExclusions], { cwd: repositoryRoot, maxBuffer: 2 * 1024 * 1024 });
  if (diffResult.exitCode !== 0) throw new Error('unable to read bounded documentation-tag diff');
  if (diffResult.stdout.length > 2 * 1024 * 1024) throw new Error('documentation-tag diff exceeds bounded size');
  diffText = diffResult.stdout.toString('utf8');
}
assertNoSensitiveData(diffText, 'tag-diff');

const corpus = await buildCorpus(runner, repositoryRoot, targetSha, TAG_CORPUS_OPTIONS);
const currentGuideRoot = path.join(siteRoot, 'src/content/docs/current');
const guideImpacts: GuideImpact[] = [];
for (const filename of (await readdir(currentGuideRoot)).filter((name) => name.endsWith('.md')).sort()) {
  const source = (await readFile(path.join(currentGuideRoot, filename), 'utf8')).replace(/\r\n?/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) throw new Error(`Current Guide is missing frontmatter: ${filename}`);
  const data = YAML.parse(match[1]!) as Record<string, unknown>;
  const evidencePaths = Array.isArray(data.evidencePaths) && data.evidencePaths.every((item) => typeof item === 'string') ? data.evidencePaths as string[] : [];
  if (evidencePaths.length === 0) throw new Error(`Current Guide has no evidence paths: ${filename}`);
  const changedEvidencePaths: string[] = [];
  for (const evidencePath of evidencePaths) {
    const changed = baseSha === null
      ? { stdout: Buffer.from(evidencePath), stderr: Buffer.alloc(0), exitCode: 0 }
      : await runner.run(['git', 'diff', '--name-only', `${baseSha}..${targetSha}`, '--', evidencePath], { cwd: repositoryRoot });
    if (changed.exitCode !== 0) throw new Error(`unable to inspect guide evidence path: ${evidencePath}`);
    if (changed.stdout.toString('utf8').trim()) changedEvidencePaths.push(evidencePath);
  }
  guideImpacts.push({ file: filename, evidencePaths, changedEvidencePaths });
}
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY is required for trusted tag generation');
const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5-mini';
const identity: TagGenerationIdentity = { targetSha, baseSha, tag, previousTag, date };
const prompt = tagGenerationPrompt({ identity, corpus, corpusText: serializeCorpus(corpus), diffText, guideImpacts });
const generated = await generateTagWithRepairs(
  new OpenAITagGenerationProvider(apiKey, model),
  prompt,
  (output) => validateTagGeneratedOutput(output, identity, corpus, guideImpacts),
);
const evidence = await readVerificationEvidence(path.resolve(siteRoot, evidenceInput), targetSha);

await mkdir(path.join(outputRoot, 'guide-updates'), { recursive: true });
await mkdir(path.join(outputRoot, 'evolution'), { recursive: true });
await mkdir(path.join(outputRoot, 'evidence'), { recursive: true });
await writeFile(path.join(outputRoot, 'tag-record.json'), `${JSON.stringify(generated, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
const evolutionFile = tagEvolutionFilename(generated);
await writeFile(path.join(outputRoot, 'evolution', evolutionFile), renderTagEvolutionRecord(generated, evidence), { encoding: 'utf8', flag: 'wx' });
for (const [index, update] of generated.guideUpdates.entries()) {
  await writeFile(path.join(outputRoot, 'guide-updates', `${String(index + 1).padStart(2, '0')}.json`), `${JSON.stringify(update, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
}
const evidenceFile = `${evidence.artifactName}.json`;
await writeFile(path.join(outputRoot, 'evidence', evidenceFile), `${JSON.stringify(evidence, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
const manifest = {
  schemaVersion: 1,
  kind: 'documentation-tag',
  targetSha,
  baseSha,
  tag,
  previousTag,
  evidenceFile,
  evidenceArtifact: evidence.artifactName,
  evolutionFile,
  guideImpacts,
  guideUpdateFiles: generated.guideUpdates.map((_, index) => `${String(index + 1).padStart(2, '0')}.json`),
  corpus: { files: corpus.files.length, bytes: corpus.totalBytes, excluded: corpus.excluded },
};
assertNoSensitiveValues(manifest, 'tag-manifest.json');
await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
JSON.parse(await readFile(path.join(outputRoot, 'manifest.json'), 'utf8'));
