# V1 release checklist

Use a dedicated Railway PostgreSQL service and Vercel Preview deployment for
the automated release journey. The journey creates durable Source Text,
Flashcards, and Study Results and is not designed to run against the production
collection.

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
- [ ] Run `vercel env run -e preview -- bun run release:prepare` before the
  Preview deployment. Repeat with `-e production` before the production
  rollout.
- [ ] Confirm that `release:prepare` reports that configuration and all five v1
  tables are ready.
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
adds the remaining drafts, studies the edited card, marks it Incorrect, verifies
three other study positions, and waits for the card to become eligible again.
Reset or replace the disposable Preview database before repeating the test if
the collection has accumulated substantial test data.

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
- [ ] Run `bun run lint`, `bun run test`, and `bun run build` without granting CI
  live OpenAI access.

The checked-in v1 migrations are ordered and versioned. Apply them forward
before switching application traffic; do not use schema push in production.
The rollout remains compatible with the preceding application version because
new tables and columns were introduced before use, and the Study Result foreign
key change still accepts the non-null identifiers written by the older version.
