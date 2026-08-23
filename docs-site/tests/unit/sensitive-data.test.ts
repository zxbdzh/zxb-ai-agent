import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNoSensitiveData, assertNoSensitiveValues, SensitiveDataError } from '../../scripts/lib/sensitive-data.js';

const secret = `sk-${'x'.repeat(30)}`;

const sensitiveFixtures: ReadonlyArray<readonly [string, string]> = [
  ['checkpoint-trailers', `Learning-Motivation: token=${secret}`],
  ['external-search-sources', JSON.stringify({ excerpt: `Bearer ${'a'.repeat(30)}` })],
  ['generated-output.json', JSON.stringify({ title: `密钥 ${secret}` })],
  ['rendered-evolution-record.md', `正文 ${secret}`],
  ['guide-update.json', JSON.stringify({ replacementMarkdown: `密码 ${secret}` })],
];

test('shared guard rejects secrets in trailers, web excerpts, model output, and rendered artifacts without echoing values', () => {
  for (const [logicalPath, value] of sensitiveFixtures) {
    assert.throws(() => assertNoSensitiveData(value, logicalPath), (error: unknown) => {
      assert.ok(error instanceof SensitiveDataError);
      assert.match(error.message, new RegExp(logicalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.doesNotMatch(error.message, new RegExp(secret));
      return true;
    });
  }
});

test('object guard scans serialized nested values', () => {
  assert.throws(() => assertNoSensitiveValues({ nested: { token: secret } }, 'artifact.json'));
  assert.doesNotThrow(() => assertNoSensitiveValues({ title: '普通中文内容' }, 'artifact.json'));
});
