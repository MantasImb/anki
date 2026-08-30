# V2 release checklist

Use a dedicated Railway PostgreSQL service and Vercel Preview deployment for
the automated release journeys. This is a temporary rollout checklist: complete
every item, then delete this file together with `v2-rollout-checklist.md` only
after production verification succeeds.

## Code readiness

- [x] Normal tests isolate PostgreSQL, OpenAI, Google Translation, Railway
  Bucket, and browser boundaries from live external calls.
- [x] Release configuration requires PostgreSQL, OpenAI, Google Translation,
  Railway Bucket, and allowed-origin settings without printing their values.
- [x] Release verification checks every v2 table, column, constraint, and
  checked-in migration.
- [x] The v2 cutover requires an exact credential-free database identity before
  it can reset application and Drizzle migration schemas.
- [x] Fresh-state verification rejects retained collections, content, results,
  image state, or customized Generation Instructions and confirms the bundled
  Default Generation Template.
- [x] Separate iPhone-sized Deck and Quiz journeys clean up their run-marked
  collections after success or failure.
- [x] Deterministic lower-level tests cover `4/3/2/1` weighting, Learned-item
  eligibility, three-position Retry Gap behavior, and tiny collections.

## Preview topology

- [ ] Create a disposable Railway PostgreSQL service and private Railway
  Bucket for Preview.
- [ ] Configure Vercel Preview with every variable in the README deployment
  list. Use Railway's public PostgreSQL URL.
- [ ] Configure Railway Bucket CORS for the exact Preview origin and run
  `bun run bucket:cors:verify` with the Preview environment loaded.
- [ ] Confirm that no database, OpenAI, Google, or Bucket secret uses a
  `NEXT_PUBLIC_` prefix.
- [ ] Run `bun run release:prepare` against the disposable Preview database.
- [ ] Deploy Preview and record its exact `https://...vercel.app` URL.

## Automated phone journeys

Install Chromium once, then run:

```bash
bunx playwright install chromium
RELEASE_BASE_URL=https://your-preview.vercel.app bun run test:e2e:release
```

- [ ] Deck journey creates a Deck and Flashcard, studies it to Learned, reloads,
  and observes durable 100% Deck Progress.
- [ ] Quiz journey creates a Quiz, translates and reviews a multiple-answer
  Question, uploads and reads a PNG through Railway, uses Translation Help,
  observes Answer Feedback and the Retry Gap, and reloads durable Quiz Progress.
- [ ] No run-marked Deck or Quiz remains after the test.

## Deployed smoke checks

- [ ] Generate Flashcards with the configured OpenAI model, review drafts, and
  add them to a Deck.
- [ ] Trigger a safe OpenAI failure in Preview, restore configuration, retry,
  and confirm Source Text is retained.
- [ ] Create, edit, study, and delete both a Flashcard and a Quiz Question.
- [ ] Upload and read a Question Image directly through Railway; replace or
  delete it and confirm cleanup failure, if simulated, does not restore content.
- [ ] Translate a new Question with Google, review English, save, and confirm a
  provider failure preserves manual fallback fields.
- [ ] Inspect Vercel logs for provider and persistence diagnostics. Confirm no
  source text, question text, credentials, database URLs, presigned URLs, or
  query parameters are printed.
- [ ] Open the same Preview URL on a phone and desktop and confirm Decks,
  Quizzes, images, results, Recall Streaks, and progress share durable state.
- [ ] Confirm collection management, forms, answer controls, feedback, progress,
  and destructive actions remain usable at both phone and desktop widths.

## Accepted public-access risk

- [ ] Reconfirm that v2 intentionally has no authentication, ownership, or
  deployment protection.
- [ ] Reconfirm that anyone who obtains the public URL can read or change all
  learning data and repeatedly request presigned uploads up to the 25 MB limit.
- [ ] Confirm monitoring and provider/bucket quotas are acceptable for this
  temporary posture. Do not treat file-size validation as abuse protection.

## Production cutover

- [ ] Copy the exact production Railway URL into `RELEASE_DATABASE_URL`.
- [ ] Run `bun run release:target` and compare its credential-free
  `host:port/database` output with the intended production service.
- [ ] Confirm the target is a new database not referenced by a deployment, or
  disable all application traffic to it until verification and deployment are
  complete.
- [ ] Immediately before reset, obtain the Learner's explicit confirmation for
  that exact target and deletion scope.
- [ ] Set `RELEASE_TRAFFIC_ISOLATED=true` and
  `RELEASE_DATABASE_CONFIRMATION` to the exact printed identity, then run
  `bun run release:cutover:v2`. This permanently deletes all existing application
  data and customized Generation Instructions in that database.
- [ ] Confirm the command reports that configuration, complete v2 schema, fresh
  state, and the Default Generation Template are ready.
- [ ] Deploy v2, then create the first Deck and first Quiz. No default collection
  should exist. Keep traffic isolated until the deployment uses the verified
  database; switch Vercel's `DATABASE_URL` only now when using a new database.
- [ ] Repeat the core phone checks and one desktop check against Production.
- [ ] Run the OpenAI, Google Translation, Railway upload/read, persistence, and
  deletion smoke checks against Production.
- [ ] Complete `docs/v2-rollout-checklist.md`, then delete both temporary
  checklist files in the final verified release change.
