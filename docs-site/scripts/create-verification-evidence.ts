import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertFullSha } from './lib/identity.js';
import { createVerificationEvidence } from './lib/verification.js';
import { assertNoSensitiveValues } from './lib/sensitive-data.js';

const sha = assertFullSha(process.argv[2] ?? '');
const runUrl = process.argv[3] ?? '';
const output = path.resolve(process.argv[4] ?? '.verification');
const evidence = createVerificationEvidence(sha, runUrl);
assertNoSensitiveValues(evidence as unknown as Record<string, unknown>, 'verification-evidence.json');
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'verification-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
