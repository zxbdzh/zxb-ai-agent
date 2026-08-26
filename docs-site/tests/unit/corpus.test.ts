import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCorpus, CorpusGuardError } from '../../scripts/lib/corpus.js';
import type { CommandResult, CommandRunner } from '../../scripts/lib/command-runner.js';

class FixtureRunner implements CommandRunner {
  readonly calls: readonly string[][] = [] as string[][];
  constructor(private readonly files: Record<string, Buffer>) {}
  async run(argv: readonly string[]): Promise<CommandResult> {
    (this.calls as string[][]).push([...argv]);
    if (argv.length === 6 && argv[1] === 'ls-tree') {
      return { stdout: Buffer.from(`${Object.keys(this.files).join('\0')}\0`), stderr: Buffer.alloc(0), exitCode: 0 };
    }
    if (argv.length === 4 && argv[1] === 'cat-file' && argv[2] === '-s') {
      const path = argv[3]!.slice(argv[3]!.indexOf(':') + 1);
      return { stdout: Buffer.from(String(this.files[path]!.length)), stderr: Buffer.alloc(0), exitCode: 0 };
    }
    if (argv.length === 3 && argv[1] === 'show') {
      const path = argv[2]!.slice(argv[2]!.indexOf(':') + 1);
      return { stdout: this.files[path]!, stderr: Buffer.alloc(0), exitCode: 0 };
    }
    throw new Error(`unexpected fixture command: ${argv.join(' ')}`);
  }
}

const sha = 'a'.repeat(40);

test('corpus uses fixed git argv and excludes generated and credential paths before reading', async () => {
  const runner = new FixtureRunner({ 'src/App.java': Buffer.from('class App {}'), 'docs-site/dist/index.html': Buffer.from('generated'), '.env': Buffer.from('SECRET=value') });
  const corpus = await buildCorpus(runner, 'repo', sha);
  assert.deepEqual(runner.calls, [
    ['git', 'ls-tree', '-r', '-z', '--name-only', sha],
    ['git', 'cat-file', '-s', `${sha}:src/App.java`],
    ['git', 'show', `${sha}:src/App.java`],
  ]);
  assert.deepEqual(corpus.files.map((file) => file.path), ['src/App.java']);
  assert.deepEqual(corpus.excluded.map((item) => item.rule), ['generated-or-vendor-path', 'credential-path']);
});

test('corpus supports bounded caller exclusions before enforcing the file limit', async () => {
  const runner = new FixtureRunner({
    'src/App.java': Buffer.from('class App {}'),
    'docs-site/src/content/docs/evolution/old.md': Buffer.from('历史记录'),
    'docs-site/public/evidence/old.json': Buffer.from('{}'),
  });
  const corpus = await buildCorpus(runner, 'repo', sha, { excludedPrefixes: ['docs-site/src/content/docs/evolution/', 'docs-site/public/evidence/'] });
  assert.deepEqual(corpus.files.map((file) => file.path), ['src/App.java']);
  assert.deepEqual(corpus.excluded.map((item) => item.path), ['docs-site/src/content/docs/evolution/old.md', 'docs-site/public/evidence/old.json']);
  await assert.rejects(() => buildCorpus(runner, 'repo', sha, { excludedPrefixes: ['../escape'] }));
});

test('corpus excludes NUL content', async () => {
  const runner = new FixtureRunner({ 'image.bin': Buffer.from([1, 0, 2]) });
  const corpus = await buildCorpus(runner, 'repo', sha);
  assert.equal(corpus.files.length, 0);
  assert.equal(corpus.excluded[0]?.rule, 'binary-nul');
});

test('corpus excludes invalid UTF-8 without sending it to the model', async () => {
  const runner = new FixtureRunner({ 'invalid.txt': Buffer.from([0xff, 0xfe, 0xfd]) });
  const corpus = await buildCorpus(runner, 'repo', sha);
  assert.equal(corpus.files.length, 0);
  assert.equal(corpus.excluded[0]?.rule, 'binary-invalid-utf8');
});

test('corpus checks Git object size before reading oversized content', async () => {
  const runner = new FixtureRunner({ 'large.txt': Buffer.alloc(256 * 1024 + 1, 97) });
  const corpus = await buildCorpus(runner, 'repo', sha);
  assert.equal(corpus.files.length, 0);
  assert.equal(corpus.excluded[0]?.rule, 'oversized-file');
  assert.deepEqual(runner.calls, [
    ['git', 'ls-tree', '-r', '-z', '--name-only', sha],
    ['git', 'cat-file', '-s', `${sha}:large.txt`],
  ]);
});

test('secret guard fails closed and reports no matched value', async () => {
  const secret = `sk-${'x'.repeat(30)}`;
  const runner = new FixtureRunner({ 'src/config.txt': Buffer.from(`token=${secret}`) });
  await assert.rejects(() => buildCorpus(runner, 'repo', sha), (error: unknown) => {
    assert.ok(error instanceof CorpusGuardError);
    assert.match(error.message, /src\/config\.txt \[(?:openai-key|generic-secret-assignment)\]/);
    assert.doesNotMatch(error.message, new RegExp(secret));
    return true;
  });
});
