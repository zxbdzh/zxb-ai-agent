import { assertFullSha } from './identity.js';

export interface ExistingPullRequest {
  number: number;
  state: 'OPEN' | 'CLOSED';
  mergedAt: string | null;
  headRefName: string;
}

export type PullRequestDecision =
  | { action: 'create'; branch: string }
  | { action: 'update'; branch: string; number: number }
  | { action: 'reopen'; branch: string; number: number }
  | { action: 'terminal'; branch: string; number: number };

export function checkpointBranch(sha: string): string {
  return `docs/checkpoint-${assertFullSha(sha)}`;
}

export function resolvePullRequestIdentity(sha: string, existing: readonly ExistingPullRequest[]): PullRequestDecision {
  const branch = checkpointBranch(sha);
  const matching = existing.filter((pullRequest) => pullRequest.headRefName === branch);
  if (matching.length > 1) throw new Error(`multiple pull requests already exist for checkpoint ${sha}`);
  const pullRequest = matching[0];
  if (!pullRequest) return { action: 'create', branch };
  if (!Number.isSafeInteger(pullRequest.number) || pullRequest.number <= 0) throw new Error('invalid pull request number');
  if (pullRequest.mergedAt !== null) return { action: 'terminal', branch, number: pullRequest.number };
  if (pullRequest.state === 'CLOSED') return { action: 'reopen', branch, number: pullRequest.number };
  return { action: 'update', branch, number: pullRequest.number };
}
