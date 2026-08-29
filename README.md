# Norwegian Flashcards

A phone-friendly Next.js application for creating and studying Norwegian-to-English flashcards.

## Required service setup

You need a Railway PostgreSQL database, an OpenAI API project, and a Google
Cloud project before every application workflow can run.

### 1. Create the PostgreSQL database

1. Open [Railway](https://railway.com/new), create a project, and add a
   PostgreSQL service. Railway's
   [PostgreSQL guide](https://docs.railway.com/guides/postgresql) describes the
   database service and connection variables.
2. In the PostgreSQL service, open **Variables** and copy the public/external
   connection value, normally exposed as `DATABASE_PUBLIC_URL`.
3. Use that value as this application's `DATABASE_URL`. The internal Railway
   URL only works between services running inside Railway's private network;
   local development and Vercel require the public/external URL.

### 2. Configure OpenAI

1. Create or select an OpenAI API project, then create a secret key on the
   [API keys page](https://platform.openai.com/api-keys).
2. Add API credit or billing on the
   [billing page](https://platform.openai.com/settings/organization/billing/overview).
   A ChatGPT subscription does not provide API credit.
3. Choose a model that supports the Responses API and Structured Outputs. The
   example configuration uses `gpt-5.6`; available models are listed in the
   [OpenAI model documentation](https://developers.openai.com/api/docs/models).
4. Keep the API key in server-side environment settings only. Never prefix it
   with `NEXT_PUBLIC_` or commit it to Git.

## Local development

Requires Node.js 20.9 or newer and [Bun](https://bun.sh/).

Install dependencies and create the ignored local environment file:

```bash
bun install
cp .env.example .env
```

Replace the placeholders in `.env`:

```dotenv
DATABASE_URL=postgresql://your-railway-public-connection
OPENAI_API_KEY=your-openai-project-key
OPENAI_MODEL=gpt-5.6
OPENAI_TIMEOUT_MS=60000
SOURCE_TEXT_MAX_CHARACTERS=20000
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
GOOGLE_CLOUD_TRANSLATION_CREDENTIALS='{"client_email":"translator@example.iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"}'
GOOGLE_CLOUD_TRANSLATION_LOCATION=global
GOOGLE_CLOUD_TRANSLATION_TIMEOUT_MS=10000
RAILWAY_BUCKET_ENDPOINT=https://storage.railway.app
RAILWAY_BUCKET_REGION=auto
RAILWAY_BUCKET_NAME=your-railway-bucket-name
RAILWAY_BUCKET_ACCESS_KEY_ID=your-railway-bucket-access-key
RAILWAY_BUCKET_SECRET_ACCESS_KEY=your-railway-bucket-secret-key
QUESTION_IMAGE_ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
```

`SOURCE_TEXT_MAX_CHARACTERS` is optional and defaults to `20000`. It limits a
single Source Text before an OpenAI request is made.

`OPENAI_TIMEOUT_MS` is optional and defaults to `60000` (60 seconds). A timed
out attempt retains the Source Text and can be retried from the application.

Enable Cloud Translation Advanced for the configured Google Cloud project and
store a service account JSON key as the one-line
`GOOGLE_CLOUD_TRANSLATION_CREDENTIALS` value. The location and timeout are
optional and default to `global` and `10000` milliseconds.

Create a private Railway Bucket and copy its S3-compatible endpoint, region,
bucket name, access key, and secret key into the matching variables above.
Then configure browser-upload CORS:

1. Install the AWS CLI with `brew install awscli`.
2. Load the environment variables with `set -a; source .env; set +a`. Use
   `.env.local` instead if that is where the variables are stored.
3. Apply a rule that allows `PUT`, upload headers, and every origin listed in
   `QUESTION_IMAGE_ALLOWED_ORIGINS`:

```bash
AWS_ACCESS_KEY_ID="$RAILWAY_BUCKET_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$RAILWAY_BUCKET_SECRET_ACCESS_KEY" \
aws s3api put-bucket-cors \
  --bucket "$RAILWAY_BUCKET_NAME" \
  --endpoint-url "$RAILWAY_BUCKET_ENDPOINT" \
  --region "$RAILWAY_BUCKET_REGION" \
  --cors-configuration '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["PUT"],"AllowedOrigins":["http://localhost:3000","https://your-app.vercel.app"],"MaxAgeSeconds":3000}]}'
```

4. Verify the live rule without printing credentials:

```bash
bun run bucket:cors:verify
```

Replace `https://your-app.vercel.app` in both the environment variable and the
CORS command with each real Preview or Production origin before deployment.

Apply every versioned database migration, then start the application:

```bash
bun run db:migrate
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

The main workflows are:

- `/study` — start a self-assessed study session immediately. Recall the
  Norwegian Front, reveal the English Back, then mark the attempt Correct or
  Incorrect. Results and Recall Streaks persist in PostgreSQL.
- `/cards/new` — create a Flashcard manually.
- `/cards` — browse, edit, or delete saved Flashcards.
- `/generate` — paste Norwegian Source Text and generate pending Card Drafts.
- `/settings/generation` — edit or restore the persistent Generation
  Instructions used by future attempts.
- `/sources/{id}/drafts` — edit or remove completed drafts, then add every
  remaining draft to the collection with one button. Added drafts become
  studyable Flashcards and retain their Source Text relationship. A failed
  attempt can also be retried without pasting the Source Text again.

## Deployment environment

Add the same variables to the application's protected deployment environment:

- `DATABASE_URL` — Railway's public/external PostgreSQL URL when the app runs
  on Vercel.
- `OPENAI_API_KEY` — the secret OpenAI project key.
- `OPENAI_MODEL` — the configured Structured Outputs-capable model.
- `OPENAI_TIMEOUT_MS` — optional provider request timeout in milliseconds.
- `SOURCE_TEXT_MAX_CHARACTERS` — optional Source Text guardrail.
- `GOOGLE_CLOUD_PROJECT_ID` — project with Cloud Translation Advanced enabled.
- `GOOGLE_CLOUD_TRANSLATION_CREDENTIALS` — one-line service account JSON with
  `client_email` and `private_key`, stored only in protected server
  configuration.
- `GOOGLE_CLOUD_TRANSLATION_LOCATION` — optional API location (defaults to
  `global`).
- `GOOGLE_CLOUD_TRANSLATION_TIMEOUT_MS` — optional request timeout in
  milliseconds (defaults to `10000`).
- `RAILWAY_BUCKET_ENDPOINT`, `RAILWAY_BUCKET_REGION`,
  `RAILWAY_BUCKET_NAME`, `RAILWAY_BUCKET_ACCESS_KEY_ID`, and
  `RAILWAY_BUCKET_SECRET_ACCESS_KEY` — private S3-compatible bucket settings.
- `QUESTION_IMAGE_ALLOWED_ORIGINS` — comma-separated local, Preview, and
  Production browser origins allowed to upload directly by bucket CORS.

Apply migrations to the production database before using a deployment. Do not
expose database, provider, or bucket credentials to browser code.

Set these values in Vercel's **Preview** and **Production** environments as
appropriate. Never create `NEXT_PUBLIC_DATABASE_URL` or
`NEXT_PUBLIC_OPENAI_API_KEY`. Also never expose Google credentials under
`NEXT_PUBLIC_GOOGLE_CLOUD_TRANSLATION_CREDENTIALS`; startup validation rejects
these names so credentials cannot be bundled for browser use. Bucket access
keys and secrets must never use a `NEXT_PUBLIC_` prefix either.

The generated Vercel URL is publicly reachable. V1 intentionally has no
accounts, authorization, or Vercel Deployment Protection, so do not store
material that should not be visible to someone who obtains the URL.

### Release preparation

Release preparation deliberately ignores the ordinary `DATABASE_URL` when
choosing its migration target. Set the exact database URL as
`RELEASE_DATABASE_URL` in the ignored local `.env` file:

```dotenv
RELEASE_DATABASE_URL=postgresql://user:password@host:port/database
```

Then run `bun run release:prepare`. Alternatively, export the variable only for
the current shell. Copy the URL directly from the Railway service you intend to
release and do not route this migration through `vercel env run`.
The command prints only the credential-free `host:port/database` identity,
applies every unapplied migration, verifies every checked-in migration against
Drizzle's database journal, and checks required base tables, columns, and
constraints. It does not call OpenAI, but it verifies that the API key and
configurable model are present.
Application startup performs the same application configuration validation and
fails with the offending variable name without printing its value.

Use a separate disposable Railway database for Vercel Preview. The automated
phone journey invokes the configured OpenAI provider. Its fixture deletes the
run-marked Flashcards afterward, including after an assertion failure, while
Source Text, Card Draft, and Study Result audit records remain durable:

```bash
bunx playwright install chromium
RELEASE_BASE_URL=https://your-preview.vercel.app bun run test:e2e:release
```

The full provisioning, phone/desktop validation, safe-log checks, and manual
smoke test are in [`docs/release-checklist.md`](docs/release-checklist.md). A
beginner-friendly explanation of the browser test is in
[`docs/playwright-release-test.md`](docs/playwright-release-test.md).

The Phase 6 migrations create append-only Study Results, preserve that history
when a Flashcard is deleted, and constrain Recall Streaks to the supported
zero-through-three range. Run `bun run db:migrate` after pulling this phase
before opening `/study`.

## Database changes

After changing the Drizzle schema, generate a new versioned migration and apply
it:

```bash
bun run db:generate
bun run db:migrate
```

## Verification

```bash
bun run lint
bun run test
bun run build
```

These normal checks do not make live OpenAI requests. The opt-in deployed
release journey is deliberately separate under `test:e2e:release`.

Product requirements and architectural decisions live in [`docs/`](docs/). The phased delivery plan is in [`plans/norwegian-flashcards-v1.md`](plans/norwegian-flashcards-v1.md).
