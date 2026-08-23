import { readFile } from 'node:fs/promises';
import { verificationEvidenceSchema, type VerificationEvidence } from './verification.js';
import { assertNoSensitiveValues } from './sensitive-data.js';

export async function readVerificationEvidence(file: string, checkpointSha: string): Promise<VerificationEvidence> {
  const parsed = verificationEvidenceSchema.parse(JSON.parse(await readFile(file, 'utf8')));
  if (parsed.checkpointSha !== checkpointSha) throw new Error('verification evidence checkpoint identity mismatch');
  assertNoSensitiveValues(parsed as unknown as Record<string, unknown>, 'verification-evidence.json');
  return parsed;
}
