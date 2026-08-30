# Plan: Norwegian Learning v2

> Source PRD: [Norwegian Learning v2](../docs/prd/norwegian-learning-v2.md)

## Completion status

Phases 1–10 are implemented and the v2 production cutover is complete. On
2026-08-30, the deployed application at `https://anki-taupe.vercel.app` passed
the phone-sized Deck and Quiz release journeys, live Google Translation and
Railway image transfer checks, OpenAI generation and retry checks, cross-device
persistence checks, safe-log review, and the accepted public-access risk review.
The production database was initialized with the complete v2 schema and Default
Generation Template without default collections or retained v1 state. The
unchecked boxes below preserve the original planning criteria.

## Evidence and assumptions

- **Repository fact**: v1 is a Next.js 16 App Router application with TypeScript, Server Components for reads, Server Actions for mutations, application-facing repository contracts, and Drizzle/PostgreSQL adapters.
- **Repository fact**: the current application already implements manual and generated Flashcards, source-grounded Card Draft review, Generation Instructions, append-only Study Results, Recall Streak transitions, weighted selection, and a session-scoped Retry Gap.
- **Repository fact**: behavior tests exist at domain, workflow, provider-adapter, PostgreSQL integration, component, and phone-sized browser boundaries.
- **PRD requirement**: Flashcard Decks and Quizzes are independent collection types with no shared Topic, membership, progress, results, or mixed study session.
- **PRD requirement**: all v2 content is Norwegian with retained English translations; Google Cloud Translation automates Quiz Question translation, and Railway Buckets store optional Question Images.
- **PRD requirement**: authentication remains deferred, the application remains publicly reachable, and v2 starts against a completely fresh database.
- **Planning inference**: collection-scoped route families are durable user-facing boundaries, while exact component organization and internal helper names remain reversible implementation details.
- **Planning inference**: phases are internal tracer bullets. Temporary limitations, such as manual-only Question Translation before the Google adapter lands, are not production cutover states.
- **Planning inference**: every phase preserves all acceptance criteria completed by earlier phases and adds behavior-focused tests at the cheapest stable boundary.

## Architectural decisions

Durable decisions that apply across all phases:

- **Application**: retain Next.js App Router, TypeScript, and the Node.js runtime. Server Components read collection state, Server Actions handle ordinary Learner mutations, and narrow Route Handlers issue presigned image transfer requests.
- **Routes**: `/decks` lists and creates Flashcard Decks; `/decks/{id}` owns card browsing and collection actions; nested Deck routes own manual entry, generation, Card Draft review, and study. `/quizzes` lists and creates Quizzes; `/quizzes/{id}` owns Question management and collection actions; nested Quiz routes own Question creation/editing and study. Generation Instructions remain a global application setting.
- **Collection names**: Deck and Quiz names are required and unique within their own type through a normalized key that trims, collapses whitespace, and ignores case. Norwegian letters and punctuation remain significant, and matching Deck/Quiz display names are allowed.
- **Schema**: PostgreSQL adds Flashcard Decks, Quizzes, Quiz Questions, Answer Options, and Quiz Results. Flashcards gain required Deck ownership. Source-grounded generation retains its target Deck. Question and Option records retain Norwegian and English text; Question records also retain Recall Streak and optional image metadata.
- **Key ownership**: every Flashcard belongs to exactly one Deck, every Generation Attempt targets exactly one Deck, and every Quiz Question belongs to exactly one Quiz. Empty collections are valid; unassigned items and shared Questions are not.
- **Adaptive Learning Core**: Flashcards and Quiz Questions share Recall Streak transitions, `4/3/2/1` selection weights, the three-other-item Retry Gap, tiny-collection fallback, and progress calculation as policy only. Their repositories, results, sessions, and statistics remain separate.
- **Quiz grading**: at least two Answer Options and at least one correct option are required. One correct option derives single-select controls; two or more derive multi-select controls. Multiple-answer grading requires the exact correct set with no partial credit. Study presentation shuffles options; management preserves authored order.
- **Translation boundary**: application behavior depends on an ordered Norwegian-to-English translation contract. Google Cloud Translation Advanced is the first adapter. Generated English is reviewed and editable before save; manual English is the provider-failure fallback. Translation Help reads retained text and never calls Google during study.
- **Image boundary**: application behavior depends on stable image metadata and presigned transfer operations. A private Railway Bucket stores one optional JPEG, PNG, WebP, or GIF per Question. The UI warns above 5 MB, while the server rejects unsupported files and files above 25 MB.
- **Persistence boundary**: application and domain terms define repository contracts. Drizzle types and SQL remain inside the PostgreSQL adapter. Result insertion and Recall Streak mutation are atomic and idempotent.
- **History and deletion**: Study Results and Quiz Results are append-only and retain nullable item references after active content deletion. Collection deletion removes active children and progress after count-confirmed intent. Image cleanup is best-effort and retryable.
- **Authentication**: there are no accounts, access checks, ownership partitions, or temporary password mechanisms in v2. The public-access and upload-abuse risks are explicitly accepted until a future ADR supersedes the deferral.
- **External configuration**: PostgreSQL, OpenAI, Google Cloud Translation, and Railway Bucket credentials remain server-side and are validated without printing secret values. Normal automated tests use fakes or mocks rather than live providers.
- **Rollout**: Flashcard Deck restructuring and Quiz functionality ship together. Production starts from a completely fresh database, initializes the Default Generation Template, creates no default collections, and preserves no v1 data or customized configuration.

---

## Phase 1: Create and open independent collections

**User stories**: 1–12

### What to build

Deliver the first v2 path through schema, persistence, workflows, and responsive UI: the Learner opens separate Flashcard Deck and Quiz destinations, creates one named collection of either type, sees it in the correct list, and opens an empty detail view. Establish normalized uniqueness and collection-first navigation without adding content behavior yet.

### Acceptance criteria

- [ ] A fresh v2 database can create and retain Flashcard Deck and Quiz records without any default collections.
- [ ] Top-level navigation exposes distinct Flashcard Decks and Quizzes destinations.
- [ ] The Learner can create, list, and open an empty Flashcard Deck.
- [ ] The Learner can create, list, and open an empty Quiz.
- [ ] Collection names reject blank values and case- or whitespace-equivalent duplicates within their own type.
- [ ] A Deck and Quiz may share the same normalized name, while Norwegian letters and punctuation remain significant.
- [ ] Empty detail views show “No cards yet” or “No questions yet” rather than a learned percentage.
- [ ] Collection detail views expose the appropriate content, Study, and Add entry points without a mixed study action.
- [ ] Domain/workflow tests cover name normalization, per-type uniqueness, cross-type coexistence, and empty state.
- [ ] PostgreSQL integration tests prove independent constraints and persistence for both collection types.
- [ ] The collection list, creation form, and detail views are usable at a phone-sized viewport.

---

## Phase 2: Study the first Deck-scoped Flashcard

**User stories**: 13–14, 18–24

### What to build

Move the existing manual Flashcard and study tracer bullet inside a selected Flashcard Deck. The Learner creates a card from the Deck detail view, browses it only in that Deck, studies through the familiar Front/Back self-assessment flow, and sees Deck Progress and subtle per-card Recall Streak update durably.

### Acceptance criteria

- [ ] Every Flashcard has required ownership of exactly one Flashcard Deck.
- [ ] Manual Flashcard creation is available only after a destination Deck is selected.
- [ ] Deck detail lists only Flashcards belonging to that Deck.
- [ ] Existing Front/Back validation, editing, and individual deletion remain available inside the Deck.
- [ ] Editing Flashcard content preserves its Recall Streak.
- [ ] Starting Deck study selects only Flashcards in that Deck.
- [ ] Correct and Incorrect self-assessments retain existing Recall Streak, Retry Gap, weighting, and idempotency behavior.
- [ ] Deck Progress is calculated only from active Flashcards in that Deck.
- [ ] Flashcard list entries show restrained `0/3` through `3/3` status.
- [ ] A 100%-Learned Deck remains studyable without resetting progress.
- [ ] Workflow and PostgreSQL tests cover required ownership, Deck-scoped queries, atomic Result recording, and progress.
- [ ] Component tests cover the Deck-scoped add, list, empty, study, and progress states.

---

## Phase 3: Generate Flashcards into a selected Deck

**User stories**: 15–17

### What to build

Extend the Source Text generation tracer bullet through Deck ownership. Generation begins inside a selected Deck, and that target remains stable through Source Text persistence, provider failure, retry, Card Draft review, idempotent approval, and the created Flashcards.

### Acceptance criteria

- [ ] Source Text generation can begin only from a selected Flashcard Deck.
- [ ] Source Text and Generation Attempt state retain the target Deck through success, failure, and retry.
- [ ] Existing Generation Instructions remain global and are initialized from the Default Generation Template on the fresh database.
- [ ] A successful Generation Attempt still saves one complete Card Draft collection atomically.
- [ ] A failed attempt retains Source Text and target Deck while saving no partial drafts.
- [ ] Card Draft review remains editable and removable within the selected Deck workflow.
- [ ] Adding remaining Card Drafts creates exactly one Flashcard per approved draft in the target Deck.
- [ ] Repeated approval submission remains idempotent and cannot move or duplicate Flashcards across Decks.
- [ ] Generated Flashcards retain Source Text traceability and required Deck ownership.
- [ ] Workflow and PostgreSQL tests cover target propagation, retry, approval, idempotency, and cross-Deck isolation.
- [ ] The complete generation and review journey remains usable at a phone-sized viewport.

---

## Phase 4: Create the first Quiz Question

**User stories**: 25–33, 37, 51–52

### What to build

Deliver the first complete Quiz content path without an external translation dependency. From a selected Quiz, the Learner enters one Norwegian prompt, at least two authored options, marks exactly one option correct for this tracer bullet, supplies corresponding English manually, saves the Question, and browses or edits it in authored order. Establish the final Question/Option persistence shape and translation boundary so Google automation can replace the default manual step in the next phase.

### Acceptance criteria

- [ ] Every Quiz Question has required ownership of exactly one Quiz.
- [ ] The selected Quiz offers Add Question and Save-and-add-another actions.
- [ ] The form requires a nonblank Norwegian prompt, at least two nonblank Answer Options, and at least one correct option.
- [ ] The tracer-bullet form accepts complete English for the prompt and every option before final save.
- [ ] A Question cannot be saved with missing Norwegian or English content.
- [ ] Exactly one correct option derives single-choice behavior without storing a separate Question type.
- [ ] Answer Options persist stable identity, correctness, and authored order.
- [ ] Quiz detail lists only its own Questions and shows authored option order in management.
- [ ] The Learner can edit Norwegian, English, correctness, and option order without resetting Recall Streak.
- [ ] A second Quiz cannot read or edit the first Quiz's Questions.
- [ ] Domain/workflow tests cover validation, inferred type, ordering, ownership, creation, editing, and Save-and-add-another.
- [ ] PostgreSQL integration tests cover Question/Option constraints and transactionally complete creation.

---

## Phase 5: Automate editable Question Translation

**User stories**: 47–55, 84–85, 90

### What to build

Make Google Cloud Translation the default New Question and relevant edit path behind the provider-neutral translation contract. The form sends the Norwegian prompt and options as one ordered request, displays returned English in editable fields, persists the reviewed version, and falls back to complete manual English without losing work when the provider fails.

### Acceptance criteria

- [ ] The translation contract accepts ordered Norwegian plain-text values and returns the same number of ordered English values.
- [ ] Google Cloud Translation Advanced is implemented behind the contract with server-only configuration.
- [ ] New Question translates the prompt and every option before final save.
- [ ] Generated English remains editable, and the reviewed values are persisted.
- [ ] A timeout, refusal, incomplete response, or provider error preserves every completed Norwegian field and exposes manual English fallback.
- [ ] A Question remains unsaved until English exists for its prompt and all options.
- [ ] Editing Norwegian prompt or option text retranslates only affected content for review.
- [ ] Editing correctness, image metadata, or English alone makes no translation request.
- [ ] Provider-specific errors become concise application-level failures while diagnostic detail stays server-side.
- [ ] Translation contract and adapter tests use mocked or recorded responses and never call the live Google API.
- [ ] Workflow and component tests cover success, review edits, selective retranslation, failure fallback, retry, and preserved form state.
- [ ] Missing Google configuration fails clearly without exposing credential values.

---

## Phase 6: Study a single-answer Quiz adaptively

**User stories**: 36, 56–78, 88–89

### What to build

Deliver the first complete Quiz study loop for Questions with exactly one correct option. The selected Quiz shuffles options, presents Norwegian first, optionally swaps in retained English Translation Help, records an automatic idempotent Result, updates Recall Streak atomically, shows Answer Feedback until Next Question, and advances through the adaptive scheduler while updating Quiz Progress.

### Acceptance criteria

- [ ] Quiz study loads only Questions owned by the selected Quiz.
- [ ] A single-answer Question uses controls that allow exactly one selected option.
- [ ] Answer Options are shuffled per presentation while keeping Norwegian, English, identity, and correctness associated.
- [ ] An unassisted correct selection records Correct; an unassisted incorrect selection records Incorrect.
- [ ] Translation Help makes English primary and Norwegian secondary for the prompt and all options without changing the Question Image.
- [ ] Any translation-assisted submission records Incorrect and displays a restrained translation-used indicator.
- [ ] Submitting locks selection, highlights all correct options and selected incorrect options, and waits for Next Question.
- [ ] Correct increments Recall Streak to three; Incorrect resets it to zero.
- [ ] Quiz Result persistence contains only idempotency identity, nullable Question reference, outcome, Translation Help use, and timestamp.
- [ ] Result insertion and Recall Streak update succeed or fail together, and repeated submission cannot advance twice.
- [ ] Selection uses `4/3/2/1` weights and a session-scoped three-other-question Retry Gap with tiny-Quiz fallback.
- [ ] Quiz Progress and subtle per-Question `0/3` through `3/3` status reflect only active Questions in that Quiz.
- [ ] A 100%-Learned Quiz remains studyable and does not reset progress or produce an exam score.
- [ ] Deterministic domain tests cover grading, shuffle, streak, weight, Retry Gap, tiny Quizzes, and progress.
- [ ] Workflow, PostgreSQL, and component tests cover the complete answer-to-feedback-to-next path.

---

## Phase 7: Support exact-match multiple answers

**User stories**: 30, 33–35

### What to build

Extend the proven Quiz authoring and study loop to Questions with two or more correct options. The number of correct options derives multi-select controls, and submission is Correct only when the selected set exactly equals the correct set.

### Acceptance criteria

- [ ] Question authoring permits two or more correct Answer Options without a fixed maximum option count.
- [ ] Two or more correct options derive multiple-choice behavior without a stored type flag.
- [ ] Study controls allow selecting multiple options before one explicit submission.
- [ ] Selecting every correct option and no incorrect option records Correct.
- [ ] Missing a correct option, selecting an extra incorrect option, or both records Incorrect.
- [ ] No partial credit affects Result outcome or Recall Streak.
- [ ] Answer Feedback highlights all correct options, including correct options the Learner missed, plus selected incorrect options.
- [ ] Option shuffling and Translation Help remain correct for multi-select Questions.
- [ ] Domain tests cover exact set equality, missing selections, extra selections, empty submission handling, and shuffled order.
- [ ] Component tests cover multi-select interaction, locked feedback, and Next Question behavior on a phone viewport.

---

## Phase 8: Add durable Question Images

**User stories**: 38–46, 86–87

### What to build

Extend Question creation, editing, management, and study with one optional durable image. The browser obtains narrowly scoped presigned URLs from server routes, transfers directly to a private Railway Bucket, and persists only the stable object key and validation/display metadata with the Question.

### Acceptance criteria

- [ ] The Question form accepts at most one JPEG, PNG, WebP, or GIF and rejects unsupported types clearly.
- [ ] Selecting an image displays its file size before upload.
- [ ] Files above 5 MB show a non-blocking warning, while files above 25 MB are rejected by the server authorization boundary.
- [ ] Presigned upload and read URLs are short-lived and never expose Railway Bucket credentials.
- [ ] PostgreSQL stores a stable object key and required image metadata rather than image bytes or expiring URLs.
- [ ] Question creation cannot leave a saved Question pointing to an unauthorized or incomplete upload.
- [ ] Management and study views display the current Question Image responsively, including animated GIF behavior supported by the browser.
- [ ] Translation Help leaves the image and any embedded text unchanged.
- [ ] Replacing or removing an image updates the Question first and schedules the old object for best-effort cleanup.
- [ ] Failed object cleanup never rolls back a successful Question change and remains retryable.
- [ ] Contract tests use a fake S3-compatible client for validation, presigning, metadata, and cleanup behavior.
- [ ] Component and integration tests cover warning, rejection, upload completion, display, replacement, removal, and cleanup failure.
- [ ] Bucket configuration and CORS requirements are verified without leaking credentials.

---

## Phase 9: Complete destructive collection lifecycle

**User stories**: 18, 45, 78–80

### What to build

Complete permanent individual and collection deletion across both formats. The Learner confirms collection deletion after seeing the active item count. Active content and progress disappear immediately, append-only results retain detached history, and Question Image cleanup remains best-effort.

### Acceptance criteria

- [ ] Deleting a Quiz Question removes it from management, study eligibility, and the Quiz Progress denominator.
- [ ] Deleted Question history remains as append-only Quiz Results with a null Question reference.
- [ ] Deleting a Flashcard removes it from management, study eligibility, and the Deck Progress denominator while retaining Study Results.
- [ ] Deleting a Quiz requires confirmation that includes its active Question count.
- [ ] Deleting a Flashcard Deck requires confirmation that includes its active Flashcard count.
- [ ] Confirmed collection deletion removes all active children and the collection in one consistent workflow.
- [ ] Deletion affects no other Deck or Quiz, including a collection with the same display name in the other type.
- [ ] Question and Quiz deletion makes referenced image objects eligible for best-effort cleanup.
- [ ] A failed cleanup operation does not restore deleted domain state and can be retried safely.
- [ ] Workflow and PostgreSQL tests cover cascade versus detach behavior, progress denominators, history retention, isolation, and repeated deletion attempts.
- [ ] Component tests cover item counts, cancellation, confirmation, success, and concise failure feedback.

---

## Phase 10: Harden and cut over v2

**User stories**: 81–92

### What to build

Validate the complete product on the production topology and perform the one-time v2 cutover. Close cross-cutting responsive, configuration, observability, and release gaps discovered through one phone-sized Deck journey and one phone-sized Quiz journey. Start from a completely fresh database only after both study formats pass verification.

### Acceptance criteria

- [ ] The full automated suite passes across domain, workflow, adapter, PostgreSQL, component, and browser boundaries without live external provider calls.
- [ ] A phone-sized Deck journey creates a Deck, manually adds or generates content, studies it, and verifies durable Deck Progress.
- [ ] A phone-sized Quiz journey creates a Quiz, automatically translates and reviews a Question, optionally uploads an image, studies Incorrect and translation-assisted attempts, observes feedback and Retry Gap behavior, and verifies durable Quiz Progress.
- [ ] Deterministic lower-level tests prove scheduler weight and eligibility behavior rather than browser tests waiting on randomness.
- [ ] Release configuration validates PostgreSQL, OpenAI, Google Cloud Translation, and Railway Bucket settings without printing secret values.
- [ ] The deployed application smoke-tests direct image upload/read through Railway, live Google translation, existing OpenAI generation, and cross-device persistence.
- [ ] The public unauthenticated posture and repeated-upload risk remain documented; no unplanned account or protection behavior is introduced.
- [ ] The exact production database target is confirmed immediately before destructive cutover work.
- [ ] The target database is replaced or reset so no v1 data or customized configuration remains.
- [ ] The complete v2 schema applies cleanly, the Default Generation Template initializes, and no default Deck or Quiz is created.
- [ ] Flashcard Deck and Quiz creation, management, study, progress, deletion, and external integrations pass deployed smoke testing.
- [ ] The v2 PRD success criteria are demonstrably satisfied from both phone and desktop against the same durable state.
- [ ] The temporary rollout checklist is completed and deleted after verification.
