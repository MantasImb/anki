# Plan: Norwegian Flashcards v1

> Source PRD: [Norwegian Flashcards v1](../docs/prd/norwegian-flashcards-v1.md)

## Completion status

Phases 1–7 are implemented and covered by the v1 automated test suite. Phase 8 code and release tooling are complete; final Preview/Production deployment QA remains intentionally open in [`../docs/release-checklist.md`](../docs/release-checklist.md). The unchecked boxes below are the original planning criteria, while this status paragraph and the release checklist record completion.

## Evidence and assumptions

- **Repository fact**: v1 now contains the Next.js routes, PostgreSQL schema and migrations, provider adapter, release tooling, and layered automated tests described by this plan.
- **PRD requirement**: the product serves one implicit Learner and stores one shared personal collection without accounts or per-user ownership.
- **PRD requirement**: v1 must work from phone and desktop through a Vercel deployment and Railway PostgreSQL.
- **Planning inference**: the initial routes below provide stable user-facing entry points. Their internal component organization remains an implementation detail.
- **Planning inference**: each phase extends the same deployed application and preserves all acceptance criteria from earlier phases.

## Architectural decisions

Durable decisions that apply across all phases:

- **Application**: Next.js 16 App Router with TypeScript on the Node.js runtime. Server Components read application state; Server Actions handle Learner-triggered mutations. Route Handlers remain deferred until an external HTTP consumer exists.
- **Routes**: `/` is the small dashboard; `/cards` browses the collection; `/cards/new` provides manual entry; `/generate` accepts Source Text; `/sources/{id}/drafts` edits, removes, and adds generated Card Drafts; `/study` runs study sessions; `/settings/generation` manages Generation Instructions.
- **Schema**: PostgreSQL stores Source Texts and generation status, Card Drafts and review status, Flashcards and Recall Streak, append-only Study Results, and singleton Generation Instructions.
- **Key states**: Source Text moves through ready, completed, or failed generation status. Card Draft moves from pending to approved or rejected. Recall Streak is an integer from zero through three.
- **Persistence boundary**: application behavior depends on repository contracts. Drizzle ORM and Drizzle Kit stay inside the Railway PostgreSQL adapter.
- **Generation boundary**: application behavior depends on a provider-neutral generator that accepts Source Text and Generation Instructions and returns a complete structured Card Draft collection. OpenAI is the first adapter and uses Structured Outputs.
- **Study behavior**: Correct increments Recall Streak to a maximum of three; Incorrect resets it to zero. Relative selection weights begin at four, three, two, and one for streaks zero through three.
- **Retry behavior**: an Incorrect Flashcard is excluded until three other Flashcards have been studied. The Retry Gap is session state; persisted Recall Streak still prioritizes the card after a refresh.
- **Consistency**: successful generation saves a complete collection atomically; failed generation saves no partial drafts. Adding the remaining drafts is idempotent. Study Result insertion and Recall Streak update occur together.
- **Authentication**: there are no accounts or access checks in v1. The generated Vercel URL is publicly reachable, and that exposure is explicitly accepted.
- **External services**: Vercel hosts the application, Railway hosts PostgreSQL behind its external database endpoint, and OpenAI provides initial generation. Secrets and model choice live in protected deployment configuration.
- **Testing**: tests assert behavior at domain, application, adapter, persistence, and user-interface boundaries rather than private implementation structure. Normal automated tests never call the live OpenAI API.

---

## Phase 1: First persistent manual Flashcard

**User stories**: 1–4, 30, 46–49, 51–52

### What to build

Deliver the first complete path through the deployed application: the Learner opens the responsive interface, enters a Norwegian Front and English Back, saves a Flashcard through a Server Action, and immediately sees it in the shared collection backed by Railway PostgreSQL. Establish the persistence contract, Drizzle migration workflow, deployment configuration, and server-only secret boundary only to the depth needed for this path.

### Acceptance criteria

- [ ] The application runs locally and deploys to Vercel using the Node.js runtime.
- [ ] A Railway PostgreSQL database can be initialized from versioned Drizzle migrations.
- [ ] The Add Flashcard form requires non-empty Norwegian Front and English Back values.
- [ ] Submitting valid content creates exactly one immediately studyable Flashcard.
- [ ] The cards collection shows persisted Flashcards after refresh and from another device.
- [ ] Database configuration is available only to server-side code, and missing configuration fails clearly.
- [ ] The dashboard, creation form, and collection are usable at a phone-sized viewport.
- [ ] Domain and PostgreSQL integration tests cover validation, creation, persistence, and database constraints.

---

## Phase 2: Maintain the Flashcard collection

**User stories**: 5–6

### What to build

Extend the manual-card tracer bullet so the Learner can correct or remove saved Flashcards. Reuse the same application and persistence boundaries, and ensure mutations refresh the collection without leaking Drizzle concepts into the interface.

### Acceptance criteria

- [ ] The Learner can open a saved Flashcard for editing and see its current Front and Back.
- [ ] Saving valid edits updates the existing Flashcard rather than creating another.
- [ ] Invalid edits leave the stored Flashcard unchanged and show a useful validation error.
- [ ] The Learner can delete a Flashcard after an intentional delete action.
- [ ] A deleted Flashcard no longer appears after refresh.
- [ ] Workflow tests cover edit, validation failure, delete, and missing-card behavior.
- [ ] A phone-sized interface exposes edit and delete controls without accidental overlap or hidden actions.

---

## Phase 3: Generate the first Card Drafts

**User stories**: 7–16

### What to build

Deliver the first Source Text to Card Draft path. The Learner pastes a chapter or curriculum unit, starts a synchronous Generation Attempt, waits in a visible loading state, and receives a complete pending draft collection. Introduce only the Source Text, Card Draft, provider-neutral generation contract, OpenAI Structured Outputs adapter, and persistence behavior required for the successful path.

### Acceptance criteria

- [ ] The generation form accepts non-empty chapter- or unit-sized Norwegian Source Text and rejects input beyond a configurable guardrail.
- [ ] Starting generation persists the Source Text before invoking OpenAI.
- [ ] The OpenAI adapter receives Source Text plus the bundled Default Generation Template through the provider-neutral contract.
- [ ] A successful structured response contains only Norwegian Front and English Back pairs.
- [ ] Generated content is source-grounded, allows light normalization, and favors self-contained selections.
- [ ] The complete Card Draft collection is saved atomically and associated with its Source Text.
- [ ] The Learner sees a pending draft review screen after success.
- [ ] The UI communicates that generation is in progress and prevents accidental duplicate submission.
- [ ] Generator contract tests use mocked structured responses and make no live API calls.
- [ ] Workflow and PostgreSQL integration tests cover successful source retention and atomic draft creation.

---

## Phase 4: Configurable and resilient generation

**User stories**: 17–19, 26–29

### What to build

Make generation safe to tune and retry. The Learner can edit persistent Generation Instructions, restore the bundled default, and retry a failed Source Text. Provider failures, refusals, incomplete output, and timeouts produce no partial drafts and expose a concise retry path while retaining diagnostic information on the server.

### Acceptance criteria

- [ ] The Learner can view, edit, and save Generation Instructions.
- [ ] Saved instructions are used for subsequent Generation Attempts on any device.
- [ ] Reset restores the current bundled Default Generation Template.
- [ ] The default template requests source-grounded, self-contained, non-duplicate Card Drafts.
- [ ] Provider error, refusal, incomplete output, and timeout all mark the Source Text failed without saving partial drafts.
- [ ] A failed Source Text can be retried without being pasted again.
- [ ] A successful retry saves one complete collection and marks the Source Text completed.
- [ ] The Learner sees concise retryable errors, while server logs retain actionable diagnostic context without secrets.
- [ ] Workflow tests cover settings persistence, reset, each failure category, retry, and all-or-nothing behavior.
- [ ] Adapter contract tests normalize provider-specific failures into application-level generation failures.

---

## Phase 5: Review drafts into Flashcards

**User stories**: 20–25

### What to build

Complete the generated-content workflow. Generated Card Drafts are assumed useful by default. The Learner edits exceptions, removes unwanted drafts, and adds every remaining draft to Flashcards in one action. The bulk operation preserves Source Text traceability and remains safe under duplicate submissions.

### Acceptance criteria

- [ ] Pending Card Drafts never appear in study or the Flashcard collection before the remaining collection is added.
- [ ] The Learner can edit a pending Card Draft's Front and Back.
- [ ] One action adds every remaining Card Draft as exactly one immediately studyable Flashcard.
- [ ] The operation marks each remaining Card Draft approved and links it to the created Flashcard transactionally.
- [ ] Repeating the add request cannot create duplicate Flashcards.
- [ ] Every stored generated Flashcard retains its originating Source Text relationship.
- [ ] Removing a pending Card Draft marks it rejected and creates no Flashcard.
- [ ] Workflow and PostgreSQL integration tests cover editing, bulk addition, duplicate submission, removal, and traceability.
- [ ] A phone-sized review screen makes each draft's current state and available action clear.

---

## Phase 6: First self-assessed study session

**User stories**: 31–37, 43–44

### What to build

Deliver a basic study session across the domain, persistence, and interface boundaries. The Learner starts studying without deck configuration, sees only a Norwegian Front, reveals the English Back, and records Correct or Incorrect. Each result is retained, and Recall Streak changes persist across refreshes and devices.

### Acceptance criteria

- [ ] The Learner can start studying immediately when at least one Flashcard exists.
- [ ] A study card initially displays only its Norwegian Front.
- [ ] Revealing the answer displays its English Back without recording a result.
- [ ] The Learner can record exactly one Correct or Incorrect result for the shown attempt.
- [ ] Correct increments Recall Streak by one and caps it at three.
- [ ] Incorrect resets Recall Streak to zero.
- [ ] Study Result insertion and Recall Streak update succeed or fail together.
- [ ] Study Results are retained as history, and Recall Streak survives refresh and another device.
- [ ] Domain tests cover all streak transitions and the cap.
- [ ] Workflow and PostgreSQL integration tests cover result history and atomic state updates.
- [ ] The reveal and assessment controls are comfortable and unambiguous on a phone.

---

## Phase 7: Adaptive study ordering

**User stories**: 38–42, 45

### What to build

Replace basic card selection with the complete v1 scheduler. Eligible Flashcards are chosen with weighted variation by Recall Streak. An Incorrect result starts a three-card Retry Gap, after which the zero-streak card returns at highest priority. Tiny collections show every available alternative before returning the incorrect card.

### Acceptance criteria

- [ ] Streaks zero, one, two, and three use decreasing relative selection weights of four, three, two, and one.
- [ ] Weighted selection uses injectable or deterministic randomness in tests and avoids a fixed visible order in production.
- [ ] An incorrectly answered Flashcard cannot be selected for the next three other study positions.
- [ ] After three alternatives, the incorrect zero-streak card becomes eligible at highest priority.
- [ ] If fewer than three alternatives exist, each available alternative appears before the incorrect card can return.
- [ ] A three-streak Flashcard remains eligible at reduced frequency.
- [ ] Refreshing or starting a new session clears the short Retry Gap but retains the persisted zero streak and corresponding priority.
- [ ] Domain tests cover weight boundaries, cooldown progression, repeat answers, tiny collections, and sessions with no eligible alternatives.
- [ ] The study interface behaves continuously when the scheduler advances or temporarily has no eligible card.

---

## Phase 8: Complete phone journey and release validation

**User stories**: 1, 46–52 and the PRD success criteria

### What to build

Validate the full production tracer bullet on the actual hosting topology. Starting from a phone, the Learner pastes one curriculum unit, receives source-grounded drafts, edits or removes exceptions, adds every remaining draft, begins studying, records an Incorrect result, and observes the three-card Retry Gap. Close operational gaps discovered by this journey without expanding v1 scope.

### Acceptance criteria

- [x] A clean PostgreSQL database can be created by applying the complete migration history; Railway execution remains in final deployment QA.
- [ ] Vercel is configured with the external Railway database URL, OpenAI API key, and configurable model without exposing values to browser code or source control.
- [x] Missing or invalid deployment configuration fails clearly before a Learner workflow silently loses data.
- [x] The generated Vercel URL is documented as public, and no unplanned account or access-control behavior is introduced.
- [x] Server diagnostics contain actionable database and generation failure context without Source Text, credentials, or provider secrets being unnecessarily exposed; deployed-log inspection remains in final QA.
- [x] The phone-sized end-to-end test covers Source Text generation, draft editing, bulk addition, study, Incorrect assessment, and three alternative positions; deterministic scheduler tests prove eligible return immediately afterward.
- [ ] Smoke tests on the deployed application cover manual creation, editing, deletion, generation retry, settings reset, draft rejection, and persisted study progress.
- [x] Normal continuous-integration tests complete without live OpenAI access.
- [x] Initial schema changes remain additive enough for application rollback during the v1 rollout.
- [ ] The PRD success criterion is demonstrably satisfied from both phone and desktop against the same durable data.
