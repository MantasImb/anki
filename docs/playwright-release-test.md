# Playwright v2 phone release tests

`tests/e2e/phone-release.spec.ts` controls the deployed application through an
iPhone 13 browser profile. It is deliberately separate from `bun run test`:
normal automation never contacts live providers, while the opt-in Quiz journey
uses the deployment's Google Translation and Railway Bucket configuration.

## Journeys

The Deck journey creates a run-marked Deck, manually adds a Flashcard, records
three Correct results, and reloads the Deck to prove durable 100% progress.

The Quiz journey creates a run-marked Quiz and a multiple-answer Question. It
uses live automatic translation, reviews the returned English, uploads a tiny
PNG through a presigned Railway URL, reads it back in study, and proves that
Translation Help forces an Incorrect result. It then reaches Learned, creates
three alternatives, verifies Answer Feedback, and confirms that an Incorrect
Question stays out for the next three positions. Finally it reloads Quiz
Progress to prove persistence.

Each test deletes its run-marked collection in fixture teardown, even after an
assertion failure. Detached append-only results may remain by design. Question
Image cleanup is best-effort and can be retried by the application.

## Run safely

Use a dedicated Preview deployment and disposable database, not the production
learning database:

```bash
bunx playwright install chromium
RELEASE_BASE_URL=https://your-preview.vercel.app bun run test:e2e:release
```

The iPhone profile supplies phone viewport, touch, and mobile browser settings.
Playwright uses accessible labels and web-first assertions; the tests contain no
fixed sleeps and do not wait for weighted random reselection. Deterministic
lower-level scheduler tests prove exact weight and eligibility boundaries.

Use `--headed` to watch the journey or `--debug` to step through it. Failed runs
retain a trace under `test-results/`; open it with:

```bash
bunx playwright show-trace test-results/path-to-trace.zip
```

Common failures are missing Preview provider variables, Bucket CORS that omits
the exact Preview origin, a missing Chromium install, expired provider credit,
or an incorrect `RELEASE_BASE_URL`. Complete `release-checklist.md` before the
production reset.
