import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { assertFullSha } from './identity.js';
import { assertGuideTarget } from './allowlist.js';
import { validateGuideReplacement } from './guide-patch.js';
import { assertNoSensitiveData, assertNoSensitiveValues } from './sensitive-data.js';
import { verificationEvidenceSchema } from './verification.js';
import { assertDocsTag, tagGenerationOutputSchema, type TagGenerationOutput } from './tag-schema.js';
import YAML from 'yaml';

const CURRENT_GUIDE_FILES = [
  'conversation-memory.md',
  'model-configuration.md',
  'running-the-application.md',
  'setup.md',
  'verification-and-troubleshooting.md',
] as const;

export interface TagStagedManifest {
  schemaVersion: 1;
  kind: 'documentation-tag';
  targetSha: string;
  baseSha: string | null;
  tag: string;
  previousTag: string | null;
  evidenceFile: string;
  evidenceArtifact: string;
  evolutionFile: string;
  guideImpacts: Array<{ file: string; evidencePaths: string[]; changedEvidencePaths: string[] }>;
  guideUpdateFiles: string[];
  corpus: { files: number; bytes: number; excluded: Array<{ path: string; rule: string }> };
}

const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  kind: z.literal('documentation-tag'),
  targetSha: z.string().regex(/^[0-9a-f]{40}$/),
  baseSha: z.string().regex(/^[0-9a-f]{40}$/).nullable(),
  tag: z.string().min(1),
  previousTag: z.string().min(1).nullable(),
  evidenceFile: z.string().min(1),
  evidenceArtifact: z.string().min(1),
  evolutionFile: z.string().min(1),
  guideImpacts: z.array(z.object({
    file: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/),
    evidencePaths: z.array(z.string().min(1)).min(1).max(100),
    changedEvidencePaths: z.array(z.string().min(1)).max(100),
  }).strict()).length(5),
  guideUpdateFiles: z.array(z.string().regex(/^\d{2}\.json$/)).max(11),
  corpus: z.object({
    files: z.number().int().nonnegative().max(500),
    bytes: z.number().int().nonnegative().max(2 * 1024 * 1024),
    excluded: z.array(z.object({ path: z.string().min(1), rule: z.string().min(1) }).strict()).max(500),
  }).strict(),
}).strict();

export async function validateTagStagedOutput(stagingRoot: string, requestedSha: string): Promise<{ manifest: TagStagedManifest; generated: TagGenerationOutput }> {
  const sha = assertFullSha(requestedSha);
  if (!(await stat(stagingRoot)).isDirectory()) throw new Error('tag staging path must be a directory');
  const entries = (await readdir(stagingRoot, { withFileTypes: true })).map((entry) => entry.name).sort();
  const allowed = new Set(['evidence', 'evolution', 'guide-updates', 'manifest.json', 'tag-record.json']);
  for (const entry of entries) if (!allowed.has(entry)) throw new Error(`unexpected tag artifact: ${entry}`);
  for (const required of allowed) if (!entries.includes(required)) throw new Error(`tag staging is missing ${required}`);

  const manifest = manifestSchema.parse(JSON.parse(await readFile(path.join(stagingRoot, 'manifest.json'), 'utf8'))) as TagStagedManifest;
  assertNoSensitiveValues(manifest as unknown as Record<string, unknown>, 'tag-manifest.json');
  if (manifest.targetSha !== sha) throw new Error('tag manifest target SHA mismatch');
  assertDocsTag(manifest.tag);
  if ((manifest.baseSha === null) !== (manifest.previousTag === null)) throw new Error('tag manifest base identity is incomplete');
  if (manifest.baseSha) assertFullSha(manifest.baseSha);
  if (manifest.previousTag) assertDocsTag(manifest.previousTag);
  if (manifest.evidenceArtifact !== `checkpoint-verification-${sha}` || manifest.evidenceFile !== `${manifest.evidenceArtifact}.json`) throw new Error('tag evidence identity mismatch');
  if (!/^\d{4}-\d{2}-\d{2}-[0-9a-f]{8}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(manifest.evolutionFile) || !manifest.evolutionFile.includes(sha.slice(0, 8))) throw new Error('invalid tag Evolution Record filename');
  const guideFiles = manifest.guideImpacts.map((impact) => impact.file).sort();
  if (guideFiles.join(',') !== [...CURRENT_GUIDE_FILES].sort().join(',')) throw new Error('tag manifest must declare the exact five Current Guides');
  for (const impact of manifest.guideImpacts) {
    const evidence = new Set(impact.evidencePaths);
    if (impact.changedEvidencePaths.some((item) => !evidence.has(item))) throw new Error(`changed evidence path is not declared by ${impact.file}`);
  }
  if (new Set(manifest.guideUpdateFiles).size !== manifest.guideUpdateFiles.length) throw new Error('duplicate guide update filenames');

  const generated = tagGenerationOutputSchema.parse(JSON.parse(await readFile(path.join(stagingRoot, 'tag-record.json'), 'utf8')));
  assertNoSensitiveValues(generated as unknown as Record<string, unknown>, 'tag-record.json');
  if (generated.targetSha !== sha || generated.baseSha !== manifest.baseSha || generated.tag !== manifest.tag || generated.previousTag !== manifest.previousTag) throw new Error('generated record does not match tag manifest identity');
  if (generated.guideUpdates.length !== manifest.guideUpdateFiles.length) throw new Error('guide update count does not match manifest');

  const evolutionEntries = (await readdir(path.join(stagingRoot, 'evolution'), { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name);
  if (evolutionEntries.length !== 1 || evolutionEntries[0] !== manifest.evolutionFile) throw new Error('tag staging must contain exactly one declared Evolution Record');
  const evolutionRecord = await readFile(path.join(stagingRoot, 'evolution', manifest.evolutionFile), 'utf8');
  assertNoSensitiveData(evolutionRecord, `evolution/${manifest.evolutionFile}`);
  const frontmatterMatch = /^---\n([\s\S]*?)\n---\n/.exec(evolutionRecord.replace(/\r\n?/g, '\n'));
  if (!frontmatterMatch) throw new Error('tag Evolution Record is missing frontmatter');
  const frontmatter = YAML.parse(frontmatterMatch[1]!) as Record<string, unknown>;
  if (frontmatter.docType !== 'evolution-record' || frontmatter.checkpointSha !== sha || frontmatter.checkpointDate !== generated.date) throw new Error('tag Evolution Record identity mismatch');

  const updateEntries = (await readdir(path.join(stagingRoot, 'guide-updates'), { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  if (updateEntries.join(',') !== [...manifest.guideUpdateFiles].sort().join(',')) throw new Error('guide update directory does not exactly match manifest');
  const seenTargets = new Set<string>();
  for (const [index, filename] of manifest.guideUpdateFiles.entries()) {
    const raw = await readFile(path.join(stagingRoot, 'guide-updates', filename), 'utf8');
    assertNoSensitiveData(raw, `guide-updates/${filename}`);
    const update = JSON.parse(raw) as Record<string, unknown>;
    if (Object.keys(update).sort().join(',') !== 'replacementMarkdown,target' || typeof update.target !== 'string' || typeof update.replacementMarkdown !== 'string') throw new Error(`invalid guide update: ${filename}`);
    assertGuideTarget(update.target);
    validateGuideReplacement(update.replacementMarkdown);
    if (seenTargets.has(update.target)) throw new Error(`duplicate guide target: ${update.target}`);
    seenTargets.add(update.target);
    if (JSON.stringify(update) !== JSON.stringify(generated.guideUpdates[index])) throw new Error(`guide update does not match generated record: ${filename}`);
  }

  const evidenceEntries = (await readdir(path.join(stagingRoot, 'evidence'), { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name);
  if (evidenceEntries.length !== 1 || evidenceEntries[0] !== manifest.evidenceFile) throw new Error('tag staging must contain exactly one evidence sidecar');
  const evidence = verificationEvidenceSchema.parse(JSON.parse(await readFile(path.join(stagingRoot, 'evidence', manifest.evidenceFile), 'utf8')));
  if (evidence.checkpointSha !== sha || evidence.artifactName !== manifest.evidenceArtifact) throw new Error('tag evidence sidecar mismatch');
  return { manifest, generated };
}
