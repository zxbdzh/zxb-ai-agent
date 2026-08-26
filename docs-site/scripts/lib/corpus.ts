import type { CommandRunner } from './command-runner.js';
import { assertFullSha } from './identity.js';
import { findSensitiveData, SensitiveDataError } from './sensitive-data.js';

export interface CorpusFile { path: string; text: string }
export interface GuardFinding { path: string; rule: string }
export interface Corpus { sha: string; files: readonly CorpusFile[]; excluded: readonly GuardFinding[]; totalBytes: number }

const MAX_FILES = 500;
const MAX_FILE_BYTES = 256 * 1024;
const MAX_CORPUS_BYTES = 2 * 1024 * 1024;
const EXCLUDED_PREFIXES = ['.git/', 'docs-site/dist/', 'docs-site/node_modules/', 'node_modules/', 'vendor/', 'build/', '.gradle/', 'dist/'];
const GENERATED_NAMES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/i;
const CREDENTIAL_NAMES = /(^|\/)(\.env(?:\..*)?|credentials\.json)$/i;
const CREDENTIAL_EXTENSIONS = /\.(?:pem|key|p12|pfx|jks)$/i;

function pathRule(path: string, extraExcludedPrefixes: readonly string[] = []): string | undefined {
  if (path.startsWith('/') || path.includes('\\') || path.split('/').includes('..')) return 'unsafe-path';
  if (EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix)) || extraExcludedPrefixes.some((prefix) => path.startsWith(prefix)) || GENERATED_NAMES.test(path)) return 'generated-or-vendor-path';
  if (CREDENTIAL_NAMES.test(path) || CREDENTIAL_EXTENSIONS.test(path)) return 'credential-path';
  return undefined;
}

export async function buildCorpus(runner: CommandRunner, repositoryRoot: string, requestedSha: string, options: { excludedPrefixes?: readonly string[] } = {}): Promise<Corpus> {
  const sha = assertFullSha(requestedSha);
  const listing = await runner.run(['git', 'ls-tree', '-r', '-z', '--name-only', sha], { cwd: repositoryRoot });
  if (listing.exitCode !== 0) throw new Error('git ls-tree failed');
  const paths = listing.stdout.toString('utf8').split('\0').filter(Boolean);
  const extraExcludedPrefixes = options.excludedPrefixes ?? [];
  if (extraExcludedPrefixes.some((prefix) => !prefix || prefix.startsWith('/') || prefix.includes('\\') || prefix.split('/').includes('..'))) throw new Error('invalid corpus exclusion prefix');
  const eligibleCount = paths.filter((path) => pathRule(path, extraExcludedPrefixes) === undefined).length;
  if (eligibleCount > MAX_FILES) throw new Error(`tracked file limit exceeded (${MAX_FILES})`);

  const files: CorpusFile[] = [];
  const excluded: GuardFinding[] = [];
  let totalBytes = 0;
  for (const path of paths) {
    const rule = pathRule(path, extraExcludedPrefixes);
    if (rule) { excluded.push({ path, rule }); continue; }
    const sizeResult = await runner.run(['git', 'cat-file', '-s', `${sha}:${path}`], { cwd: repositoryRoot });
    if (sizeResult.exitCode !== 0) throw new Error(`git cat-file failed for tracked path: ${path}`);
    const declaredSize = Number(sizeResult.stdout.toString('ascii').trim());
    if (!Number.isSafeInteger(declaredSize) || declaredSize < 0) throw new Error(`invalid Git object size for tracked path: ${path}`);
    if (declaredSize > MAX_FILE_BYTES) { excluded.push({ path, rule: 'oversized-file' }); continue; }
    const result = await runner.run(['git', 'show', `${sha}:${path}`], { cwd: repositoryRoot, maxBuffer: MAX_FILE_BYTES + 1 });
    if (result.exitCode !== 0) throw new Error(`git show failed for tracked path: ${path}`);
    const bytes = result.stdout;
    if (bytes.length !== declaredSize) throw new Error(`Git object size changed while reading tracked path: ${path}`);
    if (bytes.includes(0)) { excluded.push({ path, rule: 'binary-nul' }); continue; }
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      excluded.push({ path, rule: 'binary-invalid-utf8' });
      continue;
    }
    const sensitive = findSensitiveData(text, path);
    if (sensitive.length > 0) throw new CorpusGuardError(sensitive);
    totalBytes += bytes.length;
    if (totalBytes > MAX_CORPUS_BYTES) throw new Error(`corpus size limit exceeded (${MAX_CORPUS_BYTES})`);
    files.push({ path, text });
  }
  return { sha, files, excluded, totalBytes };
}

export class CorpusGuardError extends SensitiveDataError {
  constructor(findings: readonly GuardFinding[]) {
    super(findings);
    this.name = 'CorpusGuardError';
  }
}

export function serializeCorpus(corpus: Corpus): string {
  return corpus.files.map((file) => `--- FILE: ${file.path} ---\n${file.text}`).join('\n');
}
