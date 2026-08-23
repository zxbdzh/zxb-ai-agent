# Documentation site

This isolated Node 22 project builds the Starlight learning documentation at `/zxb-ai-agent/`.

## Windows bootstrap

1. Resolve the npm `latest` dist-tags for `astro` and `@astrojs/starlight`.
2. Reject any version containing a prerelease identifier.
3. Update exact pins in `package.json` if required.
4. Run `npm ci` to reproduce the committed `package-lock.json`.
5. Run `npx playwright install chromium`, then the validation commands documented under `src/content/docs/automation/validation.md`.

The lockfile was generated on Windows with Node 22 and is the authoritative dependency snapshot. Local command results are development evidence; published Evolution Records mark checks as verified only when the SHA-bound evidence sidecar is committed with the record.

Checkpoint generation is orchestrated by the split request and processor workflows. Direct local generation additionally requires a SHA-bound verification evidence file and must run without repository write credentials.
