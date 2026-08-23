import path from 'node:path';
import { validateStagedOutput } from './lib/staged-output.js';
import { assertFullSha } from './lib/identity.js';

const staging = process.argv[2];
const sha = assertFullSha(process.argv[3] ?? '');
if (!staging) throw new Error('usage: validate-staged-output.ts <docs-site-relative-directory> <full-sha>');
const siteRoot = path.resolve(import.meta.dirname, '..');
const stagingRoot = path.resolve(siteRoot, staging);
const relative = path.relative(siteRoot, stagingRoot);
if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') throw new Error('staging directory escapes docs-site');
await validateStagedOutput(stagingRoot, sha);
console.log('Staged checkpoint output is complete, bounded, identity-matched, and free of detected sensitive data.');
