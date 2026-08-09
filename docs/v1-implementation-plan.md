# Norwegian Flashcards v1 Implementation Plan

## Objective

Build a phone-friendly, single-learner Next.js application that creates Norwegian-to-English flashcards manually or from LLM-generated drafts, then prioritizes struggling cards during self-assessed study.

## V1 scope

- Create, edit, list, and delete simple two-sided flashcards.
- Paste a chapter- or unit-sized Norwegian source text.
- Generate source-grounded Norwegian fronts and English backs with OpenAI.
- Review, edit, approve, or reject generated card drafts.
- View and customize persistent generation instructions, with a reset to the bundled template.
- Study one card at a time by revealing the back and marking the answer correct or incorrect.
- Persist cards, source texts, drafts, settings, and study results in PostgreSQL.
- Use the same data from desktop and phone through the Vercel deployment.

## Explicitly deferred

- Accounts and application access protection.
- Quizzes and automatic answer grading.
- Decks, tags, import/export, and sharing.
- File uploads and book-sized source processing.
- Background generation jobs and queues.
- Advanced spaced repetition, due dates, and daily study limits.
- Multiple LLM providers in the UI.

## Technical shape

- Next.js 16 App Router with TypeScript, deployed on Vercel using the Node.js runtime.
- Server Components read application state through application services.
- Server Actions handle UI-triggered mutations such as card editing, draft approval, study results, settings updates, and synchronous generation.
- Route Handlers are deferred until an external caller or webhook creates a real HTTP API requirement.
- PostgreSQL runs on Railway and is reached from Vercel through Railway's public database endpoint.
- Drizzle ORM and Drizzle Kit live inside the PostgreSQL adapter and own typed queries and migrations.
- OpenAI is the first implementation of a provider-neutral flashcard-generation interface.
- OpenAI Structured Outputs constrain generation to a collection of `{ front, back }` card drafts.

## Boundaries

### Flashcard generator

The application-facing generator accepts source text and generation instructions and returns card drafts. Provider-specific request types, model identifiers, token usage, refusals, and errors remain inside the adapter.

The first adapter uses OpenAI. The model name is configuration, and the API key is available only to server-side code.

### Persistence

Application behavior depends on repository interfaces rather than Drizzle. The PostgreSQL adapter implements storage for:

- Source texts and their generation state.
- Card drafts and approval status.
- Flashcards and their current recall streak.
- Append-only study results.
- The learner's customized generation instructions.

Transactions keep multi-record changes atomic, especially draft approval and recording a study result together with its updated recall streak.

## Data model

### `source_texts`

- Identifier.
- Original Norwegian content.
- Generation status: ready, completed, or failed.
- Creation and update timestamps.

### `card_drafts`

- Identifier.
- Required source-text reference.
- Norwegian front.
- English back.
- Review status: pending, approved, or rejected.
- Optional reference to the approved flashcard.
- Creation and update timestamps.

### `flashcards`

- Identifier.
- Optional source-text reference; null for manually created cards.
- Norwegian front.
- English back.
- Consecutive-correct recall streak from zero through three.
- Creation and update timestamps.

### `study_results`

- Identifier.
- Flashcard reference.
- Correct or incorrect outcome.
- Timestamp.

### `generation_settings`

- Singleton identifier.
- Customized generation instructions.
- Update timestamp.

The default generation template remains version-controlled in the application. Resetting replaces the stored customization with the current bundled template.

## Primary workflows

### Manual creation

1. The learner chooses Add Flashcard and enters a Norwegian front and English back.
2. Validation requires both values.
3. Saving immediately creates a studyable flashcard.

### Generated creation

1. The learner pastes Norwegian source text and can inspect the current generation instructions.
2. The application saves the source text before calling the generator.
3. A synchronous generation attempt returns a complete structured draft collection.
4. The application saves all drafts atomically and opens the review screen.
5. The learner edits, approves, or rejects each draft.
6. Approving a draft atomically creates its flashcard and marks the draft approved.

If generation fails, no partial drafts are saved. The source text is marked failed and remains available for retry.

### Study

1. The scheduler chooses an eligible flashcard using weighted priority.
2. The learner considers the Norwegian front and reveals the English back.
3. The learner marks the answer correct or incorrect.
4. The application records the study result and updates the recall streak in one transaction.

Correct increases the consecutive-correct streak by one, capped at three. Incorrect resets it to zero. Selection weight decreases as the streak rises; a simple initial weighting is `4 - recallStreak`.

An incorrectly answered card becomes ineligible until three other cards have been studied. It then returns at the highest priority. If fewer than three alternatives exist, every available alternative is shown before it can return. The short Retry Gap is session state; the persisted zero streak still gives the card high priority after a refresh or new session.

## Default generation template

The bundled instructions should tell the model to:

- Select useful Norwegian words, phrases, and short sentences from the supplied source text.
- Produce an English translation for each selection.
- Stay grounded in the source and avoid unrelated facts or vocabulary.
- Allow light normalization when it improves the learning card.
- Prefer self-contained fronts that remain understandable outside their paragraph.
- Avoid duplicate or near-duplicate drafts within one generation.
- Return only the structured draft collection required by the schema.

The learner can customize and persist these instructions. Reset restores the bundled version.

## Failure and consistency behavior

- Validate empty or unreasonably large source text before calling the provider; the exact size limit is a configurable guardrail.
- Preserve source text on generation timeouts, provider errors, refusals, or malformed/incomplete responses.
- Never save a partial generated collection.
- Make draft approval idempotent so repeated submission cannot create duplicate flashcards.
- Treat missing or invalid database and provider configuration as a deployment error, not a client-visible detail.
- Show concise retryable errors in the UI and retain diagnostic detail in server logs.

## Testing

- Unit-test the scheduler with deterministic randomness, including streak weights, incorrect resets, the three-card Retry Gap, and tiny decks.
- Unit-test the default generation template and reset behavior.
- Contract-test application services against fake persistence and generator implementations.
- Integration-test the Drizzle adapter against PostgreSQL, including migrations, transactions, cascades, and idempotent approval.
- Test the OpenAI adapter with recorded or mocked structured responses; live API calls are excluded from normal automated tests.
- Cover the critical phone-sized workflow: generate drafts, approve one, study it, record an incorrect result, and observe the Retry Gap.

## Deployment and rollout

1. Provision PostgreSQL on Railway and enable its external connection endpoint.
2. Configure Vercel with the Railway database URL, OpenAI API key, and configurable OpenAI model.
3. Apply Drizzle migrations before serving application code that requires them.
4. Deploy the Next.js application to Vercel's generated URL.
5. Verify manual creation, generation, draft approval, and study from a phone.
6. Keep initial migrations additive so application rollback remains possible.

The generated Vercel URL is public by default. The single learner explicitly accepts this exposure for v1; access protection remains deferred.

## Success criteria

V1 is successful when the learner can paste one curriculum unit on desktop or phone, receive editable source-grounded drafts, approve useful cards, and complete a study session in which incorrect cards return after three alternatives and mastered cards appear less often, with all state preserved across devices.
