import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { assertFullSha } from './identity.js';
import { assertGuideTarget } from './allowlist.js';
import { verificationEvidenceSchema } from './verification.js';
import { validateGuideReplacement } from './guide-patch.js';
import { assertNoSensitiveData, assertNoSensitiveValues } from './sensitive-data.js';
import YAML from 'yaml';

export interface StagedManifest {
  schemaVersion: 1;
  sha: string;
  event: 'push' | 'workflow_dispatch';
  evolutionFile: string;
  evidenceFile: string;
  guideTarget: string | null;
  evidenceArtifact: string;
  corpus: {
    files: number;
    bytes: number;
    excluded: Array<{ path: string; rule: string }>;
  };
}

const stagedManifestSchema = z.object({
  schemaVersion: z.literal(1),
  sha: z.string().regex(/^[0-9a-f]{40}$/),
  event: z.enum(['push', 'workflow_dispatch']),
  evolutionFile: z.string().min(1),
  evidenceFile: z.string().min(1),
  guideTarget: z.string().nullable(),
  evidenceArtifact: z.string().min(1),
  corpus: z.object({
    files: z.number().int().nonnegative().max(500),
    bytes: z.number().int().nonnegative().max(2 * 1024 * 1024),
    excluded: z.array(z.object({ path: z.string().min(1), rule: z.string().min(1) }).strict()).max(500),
  }).strict(),
}).strict();

export async function validateStagedOutput(stagingRoot: string, requestedSha: string): Promise<StagedManifest> {
  const sha = assertFullSha(requestedSha);
  const rootInfo = await stat(stagingRoot);
  if (!rootInfo.isDirectory()) throw new Error('staging path must be a directory');
  const entries = (await readdir(stagingRoot, { withFileTypes: true })).map((entry) => entry.name).sort();
  const allowed = new Set(['evolution', 'evidence', 'guide-update.json', 'manifest.json']);
  for (const entry of entries) if (!allowed.has(entry)) throw new Error(`unexpected staged artifact: ${entry}`);
  if (!entries.includes('evolution') || !entries.includes('evidence') || !entries.includes('manifest.json')) throw new Error('staging is incomplete');

  const manifest = stagedManifestSchema.parse(JSON.parse(await readFile(path.join(stagingRoot, 'manifest.json'), 'utf8'))) as StagedManifest;
  assertNoSensitiveValues(manifest as unknown as Record<string, unknown>, 'manifest.json');
  if (manifest.schemaVersion !== 1 || manifest.sha !== sha || !['push', 'workflow_dispatch'].includes(manifest.event)) throw new Error('invalid staged manifest identity');
  if (manifest.evidenceArtifact !== `checkpoint-verification-${sha}`) throw new Error('staged evidence identity mismatch');
  if (manifest.evidenceFile !== `${manifest.evidenceArtifact}.json`) throw new Error('staged evidence filename mismatch');
  if (!/^\d{4}-\d{2}-\d{2}-[0-9a-f]{8}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(manifest.evolutionFile) || !manifest.evolutionFile.includes(sha.slice(0, 8))) throw new Error('invalid staged Evolution Record filename');

  const evolutionEntries = (await readdir(path.join(stagingRoot, 'evolution'), { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name);
  if (evolutionEntries.length !== 1 || evolutionEntries[0] !== manifest.evolutionFile) throw new Error('staging must contain exactly one declared Evolution Record');
  const record = await readFile(path.join(stagingRoot, 'evolution', manifest.evolutionFile), 'utf8');
  assertNoSensitiveData(record, `evolution/${manifest.evolutionFile}`);
  const frontmatterMatch = /^---\n([\s\S]*?)\n---\n/.exec(record.replace(/\r\n?/g, '\n'));
  if (!frontmatterMatch) throw new Error('staged Evolution Record is missing YAML frontmatter');
  const frontmatter = YAML.parse(frontmatterMatch[1]!) as Record<string, unknown>;
  if (frontmatter.docType !== 'evolution-record' || frontmatter.checkpointSha !== sha || typeof frontmatter.checkpointDate !== 'string') throw new Error('Evolution Record frontmatter identity mismatch');

  const evidenceEntries = (await readdir(path.join(stagingRoot, 'evidence'), { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name);
  if (evidenceEntries.length !== 1 || evidenceEntries[0] !== manifest.evidenceFile) throw new Error('staging must contain exactly one declared evidence sidecar');
  const evidence = verificationEvidenceSchema.parse(JSON.parse(await readFile(path.join(stagingRoot, 'evidence', manifest.evidenceFile), 'utf8')));
  assertNoSensitiveValues(evidence as unknown as Record<string, unknown>, `evidence/${manifest.evidenceFile}`);
  if (evidence.checkpointSha !== sha || evidence.artifactName !== manifest.evidenceArtifact) throw new Error('versioned evidence identity mismatch');

  if (manifest.guideTarget === null) {
    if (entries.includes('guide-update.json')) throw new Error('unexpected guide update artifact');
  } else {
    assertGuideTarget(manifest.guideTarget);
    if (!entries.includes('guide-update.json')) throw new Error('manifest requires a guide update artifact');
    const update = JSON.parse(await readFile(path.join(stagingRoot, 'guide-update.json'), 'utf8')) as Record<string, unknown>;
    assertNoSensitiveValues(update, 'guide-update.json');
    if (update.target !== manifest.guideTarget || typeof update.replacementMarkdown !== 'string' || Object.keys(update).sort().join(',') !== 'replacementMarkdown,target') throw new Error('invalid staged guide update');
    validateGuideReplacement(update.replacementMarkdown);
  }
  return manifest;
}
