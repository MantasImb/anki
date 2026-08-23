# V1 release checklist

Use a dedicated Railway PostgreSQL service and Vercel Preview deployment for
the automated release journey. The journey cleans up its run-marked Flashcards
but retains Source Text, Card Draft, and Study Result audit records, so it is not
designed to run against the production collection.

## Code readiness completed

Local verification was completed on 2026-08-23 before final deployment QA.

- [x] `bun run test` runs the PGlite-heavy suite sequentially and passes with the
  documented default command.
- [x] Release preparation requires an explicit `RELEASE_DATABASE_URL` and
  prints its credential-free `host:port/database` identity.
- [x] Release verification checks required base tables, columns, constraints,
  and every checked-in migration recorded in `drizzle.__drizzle_migrations`.
- [x] The phone journey uses a unique marker and deletes its Flashcards after
  success or failure.
- [x] The browser journey deterministically verifies the three-card exclusion;
  the scheduler test proves eligibility immediately after the Retry Gap.

## Provision and configure

- [ ] Create a clean Railway PostgreSQL service.
- [ ] Copy Railway's public/external connection URL. A Vercel deployment cannot
  use Railway's private-network URL.
- [ ] In Vercel, configure `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and
  the optional `OPENAI_TIMEOUT_MS` and `SOURCE_TEXT_MAX_CHARACTERS` values for
  both Preview and Production as appropriate.
- [ ] Confirm that no database or provider value uses a `NEXT_PUBLIC_` prefix.
- [ ] Keep Preview connected to its own disposable database, not the production
  learning collection.
- [ ] Copy the exact target URL from Railway into `RELEASE_DATABASE_URL` in the
  ignored local `.env` file (or export it for the current shell), then run
  `bun run release:prepare`. Do not use `vercel env run` for this migration.
- [ ] Confirm that `release:prepare` prints the intended safe database identity
  and reports that configuration, all five v1 tables, and the complete checked-in
  migration journal are ready.
- [ ] Deploy to Vercel and record the generated URL. It is publicly reachable;
  v1 intentionally has no accounts, authorization, or Deployment Protection.

## Automated phone journey

Install the release browser once, then run the journey against the dedicated
Preview URL:

```bash
bunx playwright install chromium
RELEASE_BASE_URL=https://your-preview.vercel.app bun run test:e2e:release
```

The test uses the live configured generation provider and durable Preview
database. It pastes Source Text at an iPhone viewport, edits a generated draft,
adds the remaining drafts, begins study, marks a card Incorrect, and verifies
three other study positions. The deterministic scheduler test proves that the
card becomes eligible immediately afterward; the browser journey does not wait
on random weighted reselection. Its fixture removes all run-marked Flashcards,
but Source Text, Card Draft, and Study Result audit rows remain.

For a beginner-friendly explanation of the configuration, each test step,
debugging tools, and safety boundaries, see
[`playwright-release-test.md`](playwright-release-test.md).

## Deployed smoke checks

- [ ] Create a manual Flashcard, edit it, and delete it.
- [ ] Generate Card Drafts from one curriculum unit.
- [ ] Temporarily trigger a provider failure in Preview, retry generation after
  restoring configuration, and confirm the Source Text is retained.
- [ ] Inspect the Vercel server log for the failed generation. Confirm it has a
  Source Text identifier, category, and provider diagnostics but not the Source
  Text, API key, or database URL.
- [ ] Edit one draft, remove another, then add every remaining draft.
- [ ] Customize Generation Instructions and restore the default.
- [ ] Study a card, record an assessment, refresh, and confirm its Recall Streak
  remains persisted.
- [ ] Open the same Vercel URL on a phone and desktop and confirm both show the
  same Flashcards and persisted progress.
- [ ] Trigger or inspect a database failure in Preview and confirm the server log
  identifies the repository operation and safe database code/constraint without
  query parameters or credentials.
- [x] Run `bun run lint`, `bun run test`, and `bun run build` without granting CI
  live OpenAI access (completed locally on 2026-08-23: 125 tests passed).

The checked-in v1 migrations are ordered and versioned. Apply them forward
before switching application traffic; do not use schema push in production.
The rollout remains compatible with the preceding application version because
new tables and columns were introduced before use, and the Study Result foreign
key change still accepts the non-null identifiers written by the older version.
