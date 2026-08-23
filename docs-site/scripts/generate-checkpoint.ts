import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertFullSha } from './lib/identity.js';
import { assertGuideTarget } from './lib/allowlist.js';
import { validateCheckpointTrailers } from './lib/trailers.js';
import { assertNoSensitiveData, assertNoSensitiveValues } from './lib/sensitive-data.js';
import { FixedGitRunner } from './lib/command-runner.js';
import { buildCorpus, serializeCorpus } from './lib/corpus.js';
import { OpenAIResponsesGenerationProvider, OpenAIResponsesSearchProvider } from './lib/openai-responses.js';
import { boundedSearch, generateWithRepairs, generationPrompt } from './lib/generation.js';
import { evolutionFilename, renderEvolutionRecord, validateGeneratedRecord } from './lib/render.js';
import { readVerificationEvidence } from './lib/evidence-reader.js';

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
const sha = assertFullSha(options.sha ?? '');
const evidenceInput = options.evidence;
if (!evidenceInput) throw new Error('--evidence is required');
if (!['push', 'workflow_dispatch'].includes(options.event ?? '')) throw new Error('event must be push or workflow_dispatch');
const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(scriptRoot, '..');
const outputRoot = path.resolve(scriptRoot, options.output ?? '.generated');
const relativeOutput = path.relative(scriptRoot, outputRoot);
if (relativeOutput.startsWith('..') || path.isAbsolute(relativeOutput) || relativeOutput === '') throw new Error('output must be a docs-site-relative staging directory');

const runner = new FixedGitRunner();
const messageResult = await runner.run(['git', 'show', '-s', '--format=%B', sha], { cwd: repositoryRoot });
if (messageResult.exitCode !== 0) throw new Error('unable to read checkpoint commit message');
const dateResult = await runner.run(['git', 'show', '-s', '--format=%cs', sha], { cwd: repositoryRoot });
if (dateResult.exitCode !== 0) throw new Error('unable to read checkpoint commit date');
const checkpointDate = dateResult.stdout.toString('utf8').trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(checkpointDate)) throw new Error('checkpoint date is not deterministic yyyy-mm-dd');
const trailerResult = validateCheckpointTrailers(messageResult.stdout.toString('utf8'));
if (trailerResult.kind !== 'checkpoint') throw new Error('requested commit is not a Learning Checkpoint');
assertNoSensitiveValues(trailerResult.metadata as unknown as Record<string, unknown>, 'checkpoint-trailers');
assertGuideTarget(trailerResult.metadata.guide);

const corpus = await buildCorpus(runner, repositoryRoot, sha);
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY is required for trusted checkpoint generation');
const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5-mini';
const searchProvider = new OpenAIResponsesSearchProvider(apiKey, model);
const generationProvider = new OpenAIResponsesGenerationProvider(apiKey, model);
const searchQueries = [`${trailerResult.metadata.checkpoint} ${trailerResult.metadata.outcome} official documentation`];
const sources = await boundedSearch(searchProvider, searchQueries);
assertNoSensitiveData(JSON.stringify(sources), 'external-search-sources');
const prompt = generationPrompt({ sha, checkpointDate, metadata: trailerResult.metadata, corpus, corpusText: serializeCorpus(corpus), sources });
const generated = validateGeneratedRecord(await generateWithRepairs(generationProvider, prompt), trailerResult.metadata, corpus, checkpointDate, sources);
assertNoSensitiveValues(generated as unknown as Record<string, unknown>, 'validated-generated-output');
const evidence = await readVerificationEvidence(path.resolve(scriptRoot, evidenceInput), sha);

const record = renderEvolutionRecord(generated, evidence);
assertNoSensitiveData(record, 'rendered-evolution-record.md');
await mkdir(path.join(outputRoot, 'evolution'), { recursive: true });
await mkdir(path.join(outputRoot, 'evidence'), { recursive: true });
await writeFile(path.join(outputRoot, 'evolution', evolutionFilename(generated)), record, { encoding: 'utf8', flag: 'wx' });
const evidenceSidecarFile = `${evidence.artifactName}.json`;
await writeFile(path.join(outputRoot, 'evidence', evidenceSidecarFile), `${JSON.stringify(evidence, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
if (generated.guideUpdate) {
  const guideArtifact = generated.guideUpdate;
  assertNoSensitiveValues(guideArtifact as unknown as Record<string, unknown>, 'guide-update.json');
  await writeFile(path.join(outputRoot, 'guide-update.json'), `${JSON.stringify(guideArtifact, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
}
const manifest = { schemaVersion: 1, sha, event: options.event, evolutionFile: evolutionFilename(generated), evidenceFile: evidenceSidecarFile, guideTarget: generated.guideUpdate?.target ?? null, evidenceArtifact: evidence.artifactName, corpus: { files: corpus.files.length, bytes: corpus.totalBytes, excluded: corpus.excluded } };
assertNoSensitiveValues(manifest, 'manifest.json');
await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });

// Ensure staged JSON remains parseable before a workflow consumes it.
JSON.parse(await readFile(path.join(outputRoot, 'manifest.json'), 'utf8'));
