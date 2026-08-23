export interface SensitiveFinding {
  path: string;
  rule: string;
}

const SENSITIVE_RULES: ReadonlyArray<readonly [string, RegExp]> = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/],
  ['openai-key', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['generic-secret-assignment', /\b(?:api[_-]?key|secret|password|token)\s*[:=]\s*['\"]?[A-Za-z0-9/+_=-]{16,}/i],
  ['bearer-token', /\bBearer\s+[A-Za-z0-9._~+\/-]{20,}={0,2}\b/i],
] as const;

export class SensitiveDataError extends Error {
  constructor(readonly findings: readonly SensitiveFinding[]) {
    super(`sensitive-data guard rejected ${findings.length} item(s): ${findings.map((item) => `${item.path} [${item.rule}]`).join(', ')}`);
  }
}

export function findSensitiveData(text: string, logicalPath: string): readonly SensitiveFinding[] {
  return SENSITIVE_RULES
    .filter(([, pattern]) => pattern.test(text))
    .map(([rule]) => ({ path: logicalPath, rule }));
}

export function assertNoSensitiveData(text: string, logicalPath: string): void {
  const findings = findSensitiveData(text, logicalPath);
  if (findings.length > 0) throw new SensitiveDataError(findings);
}

export function assertNoSensitiveValues(values: Readonly<Record<string, unknown>>, logicalPath: string): void {
  assertNoSensitiveData(JSON.stringify(values), logicalPath);
}
