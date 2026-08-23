import { readFile } from 'node:fs/promises';
import { validateCheckpointTrailers } from './lib/trailers.js';

const file = process.argv[2];
if (!file) {
  console.error('usage: tsx scripts/verify-commit-message.ts <message-file>');
  process.exit(2);
}

try {
  validateCheckpointTrailers(await readFile(file, 'utf8'));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
