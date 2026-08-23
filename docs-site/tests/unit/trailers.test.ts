import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCheckpointTrailers } from '../../scripts/lib/trailers.js';

const subject = 'feat(agent): 增加检查点';
const complete = `${subject}\n\nLearning-Checkpoint: 对话记忆窗口\nLearning-Motivation: 保留作者动机\nLearning-Outcome: 保留作者结果\nLearning-Guide: conversation-memory#lifecycle\n`;

test('ordinary commits contain no checkpoint metadata', () => {
  assert.equal(validateCheckpointTrailers(subject).kind, 'ordinary');
});

test('complete terminal checkpoint block is accepted verbatim', () => {
  const result = validateCheckpointTrailers(complete);
  assert.equal(result.kind, 'checkpoint');
  if (result.kind === 'checkpoint') assert.deepEqual(result.metadata, {
    checkpoint: '对话记忆窗口', motivation: '保留作者动机', outcome: '保留作者结果', guide: 'conversation-memory#lifecycle',
  });
});

const invalidMessages: ReadonlyArray<readonly [string, string]> = [
  ['partial', `${subject}\n\nLearning-Checkpoint: 主题\n`],
  ['duplicate', `${complete}Learning-Motivation: duplicate\n`],
  ['unknown', `${complete}Learning-Reason: unknown\n`],
  ['blank', `${subject}\n\nLearning-Checkpoint:\nLearning-Motivation: x\nLearning-Outcome: y\n`],
  ['malformed guide', `${subject}\n\nLearning-Checkpoint: 主题\nLearning-Motivation: x\nLearning-Outcome: y\nLearning-Guide: ../setup#x\n`],
  ['nonterminal', `${subject}\n\nLearning-Checkpoint: 主题\n\nbody\n`],
];

for (const [name, message] of invalidMessages) {
  test(`${name} Learning metadata is rejected`, () => assert.throws(() => validateCheckpointTrailers(message)));
}
