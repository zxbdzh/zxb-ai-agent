import { z } from 'zod';
import { FULL_SHA } from './identity.js';

export const VERIFICATION_COMMANDS = {
  'gradle-style': './gradlew styleCheck',
  'gradle-build-no-tests': './gradlew build -x test',
} as const;

export type VerificationId = keyof typeof VERIFICATION_COMMANDS;

export const verificationEvidenceSchema = z.object({
  schemaVersion: z.literal(1),
  checkpointSha: z.string().regex(FULL_SHA),
  runUrl: z.string().regex(/^https:\/\/github\.com\/zxbdzh\/zxb-ai-agent\/actions\/runs\/[1-9][0-9]*$/),
  artifactName: z.string().regex(/^checkpoint-verification-[0-9a-f]{40}$/),
  artifactUrl: z.string().regex(/^https:\/\/github\.com\/zxbdzh\/zxb-ai-agent\/actions\/runs\/[1-9][0-9]*#artifacts$/),
  checks: z.array(z.object({
    id: z.enum(['gradle-style', 'gradle-build-no-tests']),
    command: z.string().min(1),
    status: z.literal('passed'),
  }).strict()).length(2),
}).strict().superRefine((data, context) => {
  const expected = Object.keys(VERIFICATION_COMMANDS) as VerificationId[];
  const actual = new Set(data.checks.map((check) => check.id));
  if (actual.size !== expected.length || expected.some((id) => !actual.has(id))) {
    context.addIssue({ code: 'custom', path: ['checks'], message: 'evidence must contain every fixed checkpoint check exactly once' });
  }
  for (const check of data.checks) {
    if (check.command !== VERIFICATION_COMMANDS[check.id]) {
      context.addIssue({ code: 'custom', path: ['checks'], message: `command mismatch for ${check.id}` });
    }
  }
  if (data.artifactName !== `checkpoint-verification-${data.checkpointSha}`) {
    context.addIssue({ code: 'custom', path: ['artifactName'], message: 'artifact identity must match checkpoint SHA' });
  }
  if (data.artifactUrl !== `${data.runUrl}#artifacts`) {
    context.addIssue({ code: 'custom', path: ['artifactUrl'], message: 'artifact URL must point to the evidence run artifact section' });
  }
});

export type VerificationEvidence = z.infer<typeof verificationEvidenceSchema>;

export function createVerificationEvidence(checkpointSha: string, runUrl: string): VerificationEvidence {
  return verificationEvidenceSchema.parse({
    schemaVersion: 1,
    checkpointSha,
    runUrl,
    artifactName: `checkpoint-verification-${checkpointSha}`,
    artifactUrl: `${runUrl}#artifacts`,
    checks: (Object.entries(VERIFICATION_COMMANDS) as Array<[VerificationId, string]>).map(([id, command]) => ({ id, command, status: 'passed' as const })),
  });
}
