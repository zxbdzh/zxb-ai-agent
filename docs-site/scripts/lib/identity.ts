export const FULL_SHA = /^[0-9a-f]{40}$/;
export const SHORT_SHA = /^[0-9a-f]{7,12}$/;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertFullSha(value: string): string {
  if (!FULL_SHA.test(value)) {
    throw new Error('checkpoint SHA must be 40 lowercase hexadecimal characters');
  }
  return value;
}

export function assertSlug(value: string): string {
  if (!SLUG.test(value) || value.length > 64) {
    throw new Error('slug must be 1-64 lowercase ASCII slug characters');
  }
  return value;
}
