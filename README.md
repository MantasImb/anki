# Norwegian Flashcards

A phone-friendly Next.js application for creating and studying Norwegian-to-English flashcards.

## Required service setup

You need a Railway PostgreSQL database and an OpenAI API project before Card
Draft generation can run.

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
```

`SOURCE_TEXT_MAX_CHARACTERS` is optional and defaults to `20000`. It limits a
single Source Text before an OpenAI request is made.

`OPENAI_TIMEOUT_MS` is optional and defaults to `60000` (60 seconds). A timed
out attempt retains the Source Text and can be retried from the application.

Apply every versioned database migration, then start the application:

```bash
bun run db:migrate
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

The main workflows are:

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

Apply migrations to the production database before using a deployment. Do not
expose either credential to browser code.

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

Product requirements and architectural decisions live in [`docs/`](docs/). The phased delivery plan is in [`plans/norwegian-flashcards-v1.md`](plans/norwegian-flashcards-v1.md).
