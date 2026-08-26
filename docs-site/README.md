# Documentation site

This isolated Node 22 project builds the Starlight documentation at `/zxb-ai-agent/`.

## Automatic Wiki update

Normal use is tag-driven. After a coherent batch of code has been merged to `master`, tag the current `master` commit and push the tag:

```bash
git switch master
git pull --ff-only
git tag docs-v1.0.0
git push origin docs-v1.0.0
```

`Documentation tag generation` then:

1. compares the new tag with the previous reachable `docs-v*` tag;
2. runs the fixed secret-free Gradle verification plan against the tagged checkout;
3. gives the guarded repository snapshot and bounded Git diff to the AI generator;
4. creates one version Evolution Record and updates every changed allowlisted Current Guide section;
5. opens a deterministic PR;
6. dispatches the complete documentation CI;
7. squash-merges only when the checked PR head, author, branch, and changed paths match the trusted request;
8. explicitly dispatches the existing documentation workflow on `master` so the reviewed merge is rebuilt and published to Pages.

The tag must match `docs-vMAJOR.MINOR.PATCH` (an optional prerelease suffix is allowed) and must point to the current remote `master` HEAD. Re-pushing an existing tag does not create a new Git event; rerun it from the workflow's manual dispatch with the existing tag name.

The first documentation tag creates a full repository baseline. Later tags use the previous reachable `docs-v*` tag as their comparison base. Do not move or reuse published documentation tags.

## Repository setup

Configure these values before pushing the first documentation tag:

| GitHub setting | Kind | Example | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | Environment secret | `sk-...` | Compatible service credential |
| `OPENAI_BASE_URL` | Repository variable or secret | `https://api.example.com/v1` | Responses API base; the generator appends `/responses` |
| `OPENAI_MODEL` | Repository variable or secret | `your-model-id` | Model exposed by the compatible service |

- Keep `OPENAI_API_KEY` in the protected `learning-checkpoint-generation` environment. Its deployment branch/tag policy must allow `docs-v*` tags; a required reviewer can remain enabled.
- `OPENAI_BASE_URL` must be an HTTPS URL without credentials, query, or fragment. The adapter appends `/responses` and can tolerate a provider that wraps the JSON object in explanatory text or a Markdown code fence; the final object still must pass the local strict schema.
- The compatible service must implement `POST /v1/responses` and strict JSON Schema output. A service that only implements `/v1/chat/completions` is not sufficient for this generator.
- Repository Actions must be allowed to create and approve pull requests.
- Branch protection must allow the GitHub Actions bot to squash-merge after required checks. If rules require a human approval, the automatic merge step will intentionally stop.

## Local development

Use Node 22 and the committed lockfile:

```bash
npm ci
npx playwright install chromium
npm run check
npm run build
npm run test:browser
npm run lighthouse
```

Local command results are development evidence. Published Evolution Records mark checks as verified only when the SHA-bound evidence sidecar is committed with the record.

The legacy Learning Checkpoint workflow remains available through manual dispatch for historical compatibility. Routine Wiki maintenance should use `docs-v*` tags.
