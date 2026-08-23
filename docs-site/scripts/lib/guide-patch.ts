import { GUIDE_ALLOWLIST, assertGuideTarget } from './allowlist.js';

export interface GuidePatch {
  target: string;
  replacementMarkdown: string;
}

export function validateGuideReplacement(replacementMarkdown: string): string {
  const replacement = replacementMarkdown.trim();
  if (!replacement) throw new Error('guide replacement must be nonblank');
  if (/^(?:#|##)\s/m.test(replacement) || /^---\s*$/m.test(replacement)) {
    throw new Error('guide replacement cannot create page metadata or peer sections');
  }
  return replacement;
}

export function applyGuideSection(sourceText: string, patch: GuidePatch): string {
  const target = assertGuideTarget(patch.target)!;
  const [, heading] = GUIDE_ALLOWLIST[target].split('#', 2) as [string, string];
  const source = sourceText.replace(/\r\n?/g, '\n');
  const replacement = validateGuideReplacement(patch.replacementMarkdown);

  const startMarker = `## ${heading}`;
  const start = source.indexOf(startMarker);
  if (start < 0 || source.indexOf(startMarker, start + startMarker.length) >= 0) {
    throw new Error('allowlisted section heading must occur exactly once');
  }
  const bodyStart = start + startMarker.length;
  const next = source.indexOf('\n## ', bodyStart);
  const end = next < 0 ? source.length : next;
  return `${source.slice(0, bodyStart)}\n\n${replacement}\n${source.slice(end).replace(/^\n+/, '\n')}`;
}
