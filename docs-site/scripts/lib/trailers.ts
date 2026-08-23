export const REQUIRED_TRAILERS = [
  'Learning-Checkpoint',
  'Learning-Motivation',
  'Learning-Outcome',
] as const;
export const OPTIONAL_TRAILER = 'Learning-Guide';
const TRAILER_LINE = /^([A-Za-z][A-Za-z0-9-]*):[ \t]*(.*)$/;
const GUIDE_VALUE = /^[a-z0-9]+(?:-[a-z0-9]+)*#[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type CheckpointMetadata = {
  checkpoint: string;
  motivation: string;
  outcome: string;
  guide?: string;
};

export type TrailerValidation =
  | { kind: 'ordinary'; trailers: ReadonlyMap<string, readonly string[]> }
  | { kind: 'checkpoint'; trailers: ReadonlyMap<string, readonly string[]>; metadata: CheckpointMetadata };

function terminalTrailerBlock(message: string): Array<[string, string]> {
  const lines = message.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length > 0 && (lines.at(-1)?.trim() === '' || lines.at(-1)?.trimStart().startsWith('#'))) {
    lines.pop();
  }

  const block: Array<[string, string]> = [];
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]!;
    if (line.trim() === '') break;
    const match = TRAILER_LINE.exec(line);
    if (!match) return [];
    block.unshift([match[1]!, match[2]!.trim()]);
  }
  return block;
}

export function validateCheckpointTrailers(message: string): TrailerValidation {
  const block = terminalTrailerBlock(message);
  const grouped = new Map<string, string[]>();
  for (const [key, value] of block) {
    const values = grouped.get(key) ?? [];
    values.push(value);
    grouped.set(key, values);
  }

  const learningKeys = [...grouped.keys()].filter((key) => key.startsWith('Learning-'));
  const allAllowed = new Set<string>([...REQUIRED_TRAILERS, OPTIONAL_TRAILER]);
  const unknown = learningKeys.filter((key) => !allAllowed.has(key));
  if (unknown.length > 0) throw new Error(`unknown Learning trailer: ${unknown.join(', ')}`);

  // A Learning-* line outside the one terminal trailer block is always malformed.
  const allLearningLines = message.replace(/\r\n?/g, '\n').split('\n').filter((line) => /^Learning-/.test(line));
  if (allLearningLines.length !== learningKeys.reduce((sum, key) => sum + grouped.get(key)!.length, 0)) {
    throw new Error('Learning trailers must occur in one terminal trailer block');
  }

  if (learningKeys.length === 0) return { kind: 'ordinary', trailers: grouped };

  for (const key of REQUIRED_TRAILERS) {
    const values = grouped.get(key) ?? [];
    if (values.length !== 1 || values[0] === '') {
      throw new Error(`${key} must occur exactly once and be nonblank`);
    }
  }
  const guide = grouped.get(OPTIONAL_TRAILER) ?? [];
  if (guide.length > 1 || (guide.length === 1 && !GUIDE_VALUE.test(guide[0]!))) {
    throw new Error('Learning-Guide must occur at most once as slug#section');
  }

  return {
    kind: 'checkpoint',
    trailers: grouped,
    metadata: {
      checkpoint: grouped.get('Learning-Checkpoint')![0]!,
      motivation: grouped.get('Learning-Motivation')![0]!,
      outcome: grouped.get('Learning-Outcome')![0]!,
      ...(guide[0] ? { guide: guide[0] } : {}),
    },
  };
}
