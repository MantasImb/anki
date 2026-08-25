# Norwegian Learning v2

## Problem Statement

As a Learner studying Norwegian across distinct subjects, I need to keep Flashcards and theory-style Quiz Questions in separate named collections so I can focus on one subject and one study format at a time. The v1 application places every Flashcard in one global study collection and has no automatically graded Quiz workflow, making it difficult to organize material or test knowledge with single- and multiple-answer questions.

I need to create my own Norwegian Quiz Questions, optionally include a visual prompt, answer through shuffled choices, and request English Translation Help when I do not understand the Norwegian. Translation Help must support learning without falsely advancing Norwegian mastery. I also need simple, durable progress rather than exam scores: an item is Learned after three consecutive correct results, difficult items return more often without repeating immediately, and each collection shows how much material is Learned.

## Solution

Evolve the phone-friendly, single-Learner application into two independent collection types: Flashcard Decks and Quizzes. The Learner first selects a collection and then studies, browses, adds, generates, edits, or deletes content inside it. Flashcard Decks retain the v1 two-sided, self-assessed study workflow and source-grounded LLM generation, while Quizzes introduce learner-authored Norwegian prompts, text Answer Options, automatic exact-match grading, optional Question Images, retained English Question Translations, and immediate Answer Feedback.

Both formats use the established Recall Streak, weighted selection, and Retry Gap policy while keeping membership, results, progress, and statistics completely separate. A Recall Streak of three makes a Flashcard or Quiz Question Learned and reduces its frequency without retiring it. Each Deck and Quiz shows the percentage of its own items that are Learned, and fully learned collections remain available for continued review.

Google Cloud Translation supplies editable English translations during Question creation and relevant edits through a provider-neutral boundary. Railway Buckets hold durable Question Images behind presigned browser uploads and reads. PostgreSQL remains the source of truth for relational state and progress. V2 launches against a fresh database, keeps the single-Learner public-access posture, and ships Flashcard Deck restructuring and Quiz functionality together.

## User Stories

1. As the Learner, I want separate Flashcard Decks and Quizzes, so that the two study formats never mix their content or statistics.
2. As the Learner, I want separate top-level destinations for Flashcard Decks and Quizzes, so that I can enter the intended study format directly.
3. As the Learner, I want to create a named Flashcard Deck, so that I can organize Flashcards for one subject.
4. As the Learner, I want to create a named Quiz, so that I can organize theory-style questions for one subject.
5. As the Learner, I want Deck names unique among Decks and Quiz names unique among Quizzes, so that collection lists are unambiguous.
6. As the Learner, I want one Deck and one Quiz to be allowed to share a name, so that similarly named collections remain independent rather than artificially linked.
7. As the Learner, I want collection-name uniqueness to ignore surrounding whitespace, repeated spacing, and letter case, so that superficial variants cannot create duplicates.
8. As the Learner, I want Norwegian letters and punctuation preserved during name comparison, so that genuinely different names remain distinct.
9. As the Learner, I want to select a collection before studying or managing content, so that every action has an unambiguous destination.
10. As the Learner, I want a collection detail view with progress, content, Study, and Add actions, so that related work begins from one place.
11. As the Learner, I want no global “study everything” mode in v2, so that independent collection scheduling remains understandable.
12. As the Learner, I want an empty Deck or Quiz to show a useful empty state rather than `0% learned`, so that it does not look like failed progress.
13. As the Learner, I want every Flashcard to belong to exactly one Flashcard Deck, so that no card is unassigned or counted in multiple Decks.
14. As the Learner, I want to choose a Flashcard Deck before creating a Flashcard manually, so that it becomes studyable in the correct collection.
15. As the Learner, I want to generate Card Drafts from within a selected Deck, so that every approved generated Flashcard enters that Deck.
16. As the Learner, I want Source Text, Generation Attempts, and Card Draft review to retain their target Deck, so that retries and approval cannot send cards elsewhere.
17. As the Learner, I want generated Card Drafts to retain the existing all-or-nothing, editable review workflow, so that Deck organization does not weaken generation reliability.
18. As the Learner, I want to browse, edit, and delete Flashcards within their Deck, so that Deck maintenance remains local.
19. As the Learner, I want Flashcard edits to preserve Recall Streak, so that correcting content does not introduce extra progress-reset behavior.
20. As the Learner, I want to study only the selected Deck, so that its scheduler and results are independent of every other collection.
21. As the Learner, I want Flashcard study to continue showing the Norwegian Front, revealing the English Back, and accepting my Correct or Incorrect self-assessment, so that the familiar v1 workflow remains intact.
22. As the Learner, I want each Deck to show the percentage of its Flashcards at Recall Streak three, so that I can see Deck Progress.
23. As the Learner, I want each Flashcard list entry to show a subtle `0/3` through `3/3` status, so that I can inspect progress without visual congestion.
24. As the Learner, I want a Deck at 100% Learned to remain studyable without resetting progress, so that familiar material can still be reviewed.
25. As the Learner, I want every Quiz Question to belong to exactly one Quiz, so that Question progress and results remain local.
26. As the Learner, I want to add Quiz Questions one at a time from the selected Quiz, so that each Question can be reviewed carefully.
27. As the Learner, I want a fast “Save and add another” path, so that creating a large Quiz remains practical without bulk import.
28. As the Learner, I want each Quiz Question to require a Norwegian prompt and at least two text Answer Options, so that it can be answered meaningfully.
29. As the Learner, I want to mark at least one Answer Option as correct, so that every Question has a valid answer.
30. As the Learner, I want Questions with one correct option and Questions with several correct options, so that the Quiz can represent theory-exam formats.
31. As the Learner, I want question type inferred from the correct-answer set, so that I cannot configure a contradictory single- or multiple-choice type.
32. As the Learner, I want a Question with exactly one correct option to use single-select controls, so that only one answer can be submitted.
33. As the Learner, I want a Question with multiple correct options to use multi-select controls, so that I can choose the complete answer set.
34. As the Learner, I want a multiple-answer submission correct only when it contains every correct option and no incorrect option, so that grading matches a theory exam.
35. As the Learner, I want no partial credit, so that an incomplete or over-selected answer remains Incorrect.
36. As the Learner, I want Answer Options shuffled each time a Question appears, so that I do not memorize answer positions.
37. As the Learner, I want the management view to retain authored Answer Option order, so that editing remains predictable.
38. As the Learner, I want to include at most one optional Question Image, so that road signs and visual scenarios can be tested.
39. As the Learner, I want to upload Question Images from my device, so that Quizzes do not depend on external image links.
40. As the Learner, I want JPEG, PNG, WebP, and GIF Question Images supported, so that common photos, screenshots, diagrams, and animations work.
41. As the Learner, I want the New Question form to show the selected image size, so that I understand upload cost before saving.
42. As the Learner, I want a non-blocking warning above 5 MB, so that large images are noticeable without rejecting reasonable content.
43. As the Learner, I want images above 25 MB rejected clearly, so that the public upload capability has a practical safety bound.
44. As the Learner, I want an uploaded Question Image retained durably, so that it remains available across devices and deployments.
45. As the Learner, I want replacing, removing, or deleting a Question Image not to block on cleanup failure, so that storage maintenance cannot trap content changes.
46. As the Learner, I want Question Images left unchanged by Translation Help, so that v2 does not pretend to translate text embedded in an image.
47. As the Learner, I want Google to generate English for the Norwegian prompt and all Answer Options on the New Question form, so that I do not translate large Quizzes manually.
48. As the Learner, I want the generated English shown as editable fields before I add the Question, so that I can correct theory-specific terminology.
49. As the Learner, I want my reviewed English retained with the Norwegian originals, so that Translation Help is immediate and stable during study.
50. As the Learner, I want a failed automatic translation to preserve all entered form content, so that provider failure never loses my work.
51. As the Learner, I want to enter complete English manually when automatic translation fails, so that I can still add the Question.
52. As the Learner, I want a Question blocked from final creation until its prompt and every option have English, so that Translation Help is complete for every studyable Question.
53. As the Learner, I want changed Norwegian text retranslated for review before an edit is saved, so that retained English cannot become stale.
54. As the Learner, I want edits to only the image, correct-answer set, or English text to avoid a Google request, so that translation work is not repeated unnecessarily.
55. As the Learner, I want Question edits to preserve Recall Streak and Learning Status, so that v2 avoids content-versioning and reset complexity.
56. As the Learner, I want to study one selected Quiz in an open-ended adaptive session, so that repeated learning matters more than an exam score.
57. As the Learner, I want a Question shown in Norwegian before any translation is requested, so that I first attempt to understand the learned language.
58. As the Learner, I want Translation Help to replace the primary prompt and option text with English while showing smaller Norwegian originals underneath, so that I can understand the full Question without losing its source wording.
59. As the Learner, I want using Translation Help to make the resulting Quiz Result Incorrect regardless of my selected choices, so that translated attempts never advance Norwegian mastery.
60. As the Learner, I want translation-assisted feedback to use the normal Incorrect presentation plus a compact “Translation used” indicator, so that the reason is clear without congesting the screen.
61. As the Learner, I want an unassisted exact answer to produce a Correct Quiz Result, so that independent Norwegian understanding advances progress.
62. As the Learner, I want any Incorrect Quiz Result to reset the Question Recall Streak to zero, so that forgotten material returns to high priority.
63. As the Learner, I want Correct Quiz Results to increase Recall Streak by one up to three, so that three consecutive successes make the Question Learned.
64. As the Learner, I want a Learned Question to remain eligible at reduced frequency, so that knowledge is refreshed rather than retired.
65. As the Learner, I want Questions selected with the existing `4/3/2/1` weights for Recall Streaks zero through three, so that less-learned material appears more often.
66. As the Learner, I want an Incorrect Question withheld until three other Questions have been studied, so that it does not repeat immediately.
67. As the Learner, I want every available alternative shown before retrying when fewer than three other Questions exist, so that small Quizzes remain usable.
68. As the Learner, I accept that the short Retry Gap resets with the active session, so that v2 can reuse the existing simple session behavior.
69. As the Learner, I want submitting an answer to lock my selections and show Answer Feedback, so that the recorded attempt cannot change afterward.
70. As the Learner, I want feedback to highlight every correct option and each incorrect option I selected, so that I can learn from the attempt.
71. As the Learner, I want the answered Question to remain visible until I choose Next Question, so that feedback is not rushed.
72. As the Learner, I want each Quiz to show the percentage of Questions at Recall Streak three, so that Quiz Progress replaces exam scoring.
73. As the Learner, I want each Question list entry to show a subtle `0/3` through `3/3` status, so that I can distinguish Learned and In Progress Questions.
74. As the Learner, I want a Quiz at 100% Learned to remain studyable without resetting progress, so that I can continue reviewing it.
75. As the Learner, I want no finite exam score, timer, or completion lock, so that v2 remains focused on adaptive learning.
76. As the Learner, I want Quiz Results retained as append-only history, so that Recall Streak changes have a durable audit record.
77. As the Learner, I want Quiz Result persistence limited to Question reference, outcome, Translation Help use, and timestamp, so that v2 does not add answer snapshots or history complexity.
78. As the Learner, I want deleting a Question to remove it immediately from the active list and Quiz Progress while retaining detached Quiz Results, so that historical outcomes do not keep deleted content active.
79. As the Learner, I want deleting a Quiz or Deck to require confirmation with its item count, so that a large destructive action is explicit.
80. As the Learner, I want collection deletion to remove active items and progress while retaining detached append-only results, so that deletion behavior matches individual-item history policy.
81. As the Learner, I want phone-friendly forms, Answer Options, feedback, progress, and collection actions, so that the primary experience remains comfortable on a small screen.
82. As the Learner, I want my Decks, Quizzes, content, images, results, and Recall Streaks durable across phone and desktop, so that progress is not tied to one browser.
83. As the Learner, I accept that v2 remains publicly reachable without authentication, so that access-control work does not block the learning release.
84. As the operator, I want Google Translation and Railway Bucket credentials available only to server-side code, so that provider secrets are not exposed in the browser.
85. As the operator, I want Google provider types and errors isolated behind a translation interface, so that Quiz behavior is not coupled to one SDK.
86. As the operator, I want Railway Bucket details isolated behind an image-storage interface, so that Quiz behavior works with stable image metadata rather than provider credentials or URLs.
87. As the operator, I want direct browser image transfer authorized by short-lived presigned URLs, so that private objects do not require permanent public access or Vercel proxy traffic.
88. As the operator, I want recording a Result and changing its item's Recall Streak to occur atomically, so that durable progress cannot disagree with history.
89. As the operator, I want repeated submissions idempotent, so that double taps or network retries do not advance a streak twice.
90. As the operator, I want provider, storage, validation, and persistence failures logged diagnostically while the Learner sees concise retryable errors, so that failures can be investigated without exposing internals.
91. As the operator, I want v2 deployed against a completely fresh database with the Default Generation Template, so that no v1 content, progress, or configuration needs migration.
92. As the operator, I want Flashcard Deck restructuring and Quiz functionality verified before the v2 production cutover, so that the fresh database is introduced only with the complete product model.

## Implementation Decisions

- The approved module breakdown is Adaptive Learning Core, Flashcard Deck Workflows, Quiz Workflows, Translation Boundary, Question Image Boundary, Persistence Boundary, and Next.js Interface and Release.
- Adaptive Learning Core owns Recall Streak transitions, the session-scoped Retry Gap, deterministic weighted selection, and progress calculation behind stable item-level contracts. Reuse is limited to learning policy; Flashcard and Quiz persistence, results, and statistics remain independent.
- Flashcard Deck Workflows own Deck naming and lifecycle, exact-one Deck membership for Flashcards, collection-scoped manual creation and maintenance, target Deck propagation through Source Text generation and retry, and Deck Progress.
- Quiz Workflows own Quiz naming and lifecycle, exact-one Quiz membership for Questions, one-at-a-time Question authoring, Answer Option validation and authored ordering, derived single- versus multiple-choice behavior, exact-match grading, option shuffling, Translation Help assessment, Answer Feedback, Quiz Results, and Quiz Progress.
- Collection Names are required. Uniqueness is enforced separately for Decks and Quizzes using a normalized comparison key that trims surrounding whitespace, collapses repeated internal whitespace, and ignores case. Norwegian letters and punctuation remain significant. The original normalized display value is retained.
- Collection-first navigation replaces v1 global study and global Flashcard management. Top-level Flashcard Deck and Quiz destinations lead to collection detail, management, and study experiences scoped by collection identity.
- Flashcards remain simple Norwegian Front and English Back pairs with self-assessed Study Results. Existing source-grounded generation, Card Draft review, idempotent approval, and Generation Instructions behavior remain, but every manual or generated Flashcard requires a target Deck.
- The relational model adds Flashcard Decks, Quizzes, Quiz Questions, and Answer Options. Flashcards receive a required Deck relationship. Source-grounded generation state retains its target Deck. Quiz Questions retain Norwegian and English prompts, optional Question Image metadata, Recall Streak, authored position, and Quiz ownership. Answer Options retain Norwegian and English text, correctness, authored position, and Question ownership.
- Quiz Results are append-only and contain an idempotency identifier, nullable Question reference for retained history after deletion, Correct or Incorrect outcome, Translation Help indicator, and timestamp. They do not retain selected options or content snapshots.
- Study Results remain append-only with nullable Flashcard references after deletion. Deleting a collection removes active children and progress but retains detached result history.
- Recording either Result and updating its item's Recall Streak occurs in one PostgreSQL transaction with row-level consistency. A repeated idempotency identifier returns the already recorded outcome without advancing the streak again.
- Both study formats use relative selection weights four, three, two, and one for Recall Streaks zero through three. Incorrect resets to zero and opens a three-other-item Retry Gap inside the active collection session. Tiny collections show every available alternative before retry. A new session clears the transient Retry Gap.
- Progress is `Learned items / total active items`. Empty collections present a dedicated empty state rather than a percentage. Reaching 100% does not reset, stop, or retire the collection.
- A Quiz Question requires a nonblank Norwegian prompt, at least two nonblank Answer Options, and at least one correct option. Exactly one correct option derives single-choice study controls; two or more derive multiple-choice controls. Multiple-choice grading requires exact set equality.
- Answer Options are shuffled for every study presentation while remaining associated with their Norwegian text, English translation, correctness, and stable identity. Management uses authored order.
- Translation Boundary exposes a provider-neutral operation for translating ordered Norwegian plain-text values to ordered English values. Google Cloud Translation Advanced is the initial adapter; its SDK types, project configuration, credentials, and failures do not cross the boundary.
- The New Question workflow submits the prompt and Answer Options for translation before final creation, presents English as editable fields, and persists the Learner-reviewed English. Provider failure preserves the form and enables complete manual English fallback.
- Editing Norwegian prompt or option text retranslates only affected values for review before save. Editing the correct-answer set, image, or English alone does not call Google. No Question edit resets Recall Streak.
- Translation Help is a read of retained English, never a provider call. It swaps English into primary visual position, keeps smaller Norwegian originals underneath, and marks the eventual Result Incorrect. It does not inspect Question Images.
- Question Image Boundary accepts one optional JPEG, PNG, WebP, or GIF. The client displays size and warns above 5 MB; the server rejects unsupported types and images above 25 MB before authorizing upload.
- A private Railway Bucket stores image objects. PostgreSQL stores stable object keys plus required display and validation metadata rather than image bytes or expiring URLs. Server-generated short-lived presigned URLs enable direct browser upload and read.
- Image object cleanup after replacement, removal, Question deletion, or Quiz deletion is best-effort and retryable. A cleanup failure never rolls back the content change.
- Persistence remains behind application-facing repository interfaces. Drizzle types and SQL do not cross the boundary. PostgreSQL on Railway remains the relational source of truth, with Drizzle ORM and versioned Drizzle Kit migrations inside the adapter.
- The Next.js interface continues to use Server Components for reads and Server Actions for ordinary mutations. Narrow Route Handlers are introduced where browser-to-bucket presigning requires an HTTP request/response boundary.
- The application remains optimized for phone and desktop without a separate mobile codebase. Feedback and progress metadata use restrained visual hierarchy to avoid congesting the study screen.
- Authentication, accounts, authorization, and ownership partitions remain deferred. The public deployment risk, including repeated presigned upload requests, is explicitly accepted; the 25 MB limit is not treated as authentication.
- V2 uses server-only protected configuration for PostgreSQL, OpenAI generation, Google Cloud Translation, and Railway Bucket access. Startup and release checks fail clearly on missing required configuration without printing secrets.
- V2 starts with a completely fresh database and the Default Generation Template. No v1 learning data or customized configuration is migrated. Flashcard Deck and Quiz functionality ship together in one production cutover.

## Testing Decisions

- Good tests assert behavior visible through domain contracts, workflow ports, persistence behavior, or the rendered interface. Tests must not depend on private helper layout, Drizzle query syntax, SDK internals, generated presigned URL text, or incidental component structure.
- Adaptive Learning Core receives deterministic unit tests for Correct increments, Incorrect resets, the three-item Retry Gap, tiny collections, `4/3/2/1` weight boundaries, collection scoping, Learned eligibility, and empty/partial/complete progress.
- Collection-name behavior receives unit and persistence tests for required values, trimming, repeated whitespace, case-insensitive collisions within a type, same-name Deck/Quiz coexistence, and significant Norwegian letters and punctuation.
- Flashcard Deck Workflows receive behavior tests through fake persistence and generation ports for collection creation, required Deck membership, manual creation, generation target propagation, retry, draft approval, Deck-scoped browsing/study, progress, editing without reset, and destructive deletion.
- Quiz Workflows receive behavior tests through fake persistence, translation, and image ports for Question validation, derived control type, exact-match grading, option shuffling, creation and edit translation states, manual fallback, Translation Help assessment, feedback state, idempotent result recording, progress, edits without reset, and deletion.
- Translation Boundary receives contract tests for ordered batch translation, success, refusal or provider error translation, malformed or incomplete responses, timeout, and safe error mapping. The Google adapter uses mocked or recorded responses; normal automated tests never call the live API.
- Question Image Boundary receives contract tests for supported formats, visible size metadata, 5 MB warning, 25 MB rejection, object-key handling, presigned upload/read authorization, and best-effort cleanup. Normal tests use a fake S3-compatible client and never call a live Railway Bucket.
- Persistence Boundary receives PostgreSQL integration tests after real migrations. Coverage includes required relationships, normalized-name uniqueness, ordering, cascade or detach behavior, append-only results, nullable historical references, atomic streak transitions, idempotency, and collection-scoped queries.
- Next.js component and interface tests cover collection-first navigation, empty states, New Question translation review and fallback, image validation feedback, single- and multiple-select controls, Translation Help layout, Answer Feedback, subtle progress, and destructive confirmation.
- Critical phone-sized end-to-end coverage includes one Flashcard Deck journey and one Quiz journey. The Deck journey creates a Deck, adds or generates content into it, studies, and verifies persisted progress. The Quiz journey creates a Quiz and translated Question with an optional image, answers Incorrect, observes feedback and the Retry Gap, uses Translation Help, and verifies progress and question-list status.
- Scheduler eligibility and weighting remain proven deterministically below the browser layer; end-to-end tests do not wait on random reselection.
- Release verification provisions or resets a clean database, applies all v2 migrations, confirms the Default Generation Template, verifies no default collections, checks protected provider/storage configuration, and smoke-tests both collection types through the deployed application.
- Automated tests must not require live OpenAI, Google Cloud Translation, Railway Bucket, or Vercel access. Opt-in deployed smoke tests remain separate because they incur external service and credential dependencies.

## Out of Scope

- Authentication, accounts, authorization, password protection, deployment protection, multiple Learners, shared collections, and per-Learner ownership.
- A shared Topic entity, links between similarly named Decks and Quizzes, cross-collection statistics, and mixed “study everything” sessions.
- Quiz scores, finite exam attempts, timers, pass thresholds, leaderboards, detailed analytics, and answer-history screens.
- Typed free-text answers, partial credit, configurable grading rules, Question explanations, hints other than Translation Help, and selected-option snapshots.
- Bulk Question import, export, sharing, a shared Question bank, Question reuse across Quizzes, and AI-generated Quiz Questions.
- More than one Question Image, image-based Answer Options, external image URLs, image galleries, optical character recognition, image translation, and HEIC or SVG support.
- Configurable study languages, configurable translation targets, automatic language selection, audio, and speech.
- Resetting Recall Streak when content is edited, content versioning, archive/restore, soft deletion, and undo for destructive collection actions.
- A default Flashcard Deck or Quiz, migration of v1 application data, and preservation of v1 customized Generation Instructions.
- Scheduled spaced repetition, due dates, daily study limits, reminders, offline study, and browser-local synchronization.
- Background jobs or queues for Question translation or image processing; translation remains part of the interactive create/edit workflow.
- Replacing the existing OpenAI Flashcard generation provider or exposing provider selection in the UI.

## Further Notes

- Repository fact: v1 is a Next.js 16 App Router application with TypeScript, Server Components, Server Actions, domain and workflow boundaries, provider adapters, Drizzle/PostgreSQL persistence, and behavior-focused unit, integration, component, and browser tests.
- Repository fact: v1 already implements Recall Streak, weighted selection, a session-scoped Retry Gap, idempotent result recording, append-only Study Results, source-grounded generation, Card Draft review, and protected server configuration.
- Conversation fact: the Learner wants Flashcard Decks and Quizzes to remain completely separate even when they cover the same Norwegian subject.
- Conversation fact: the primary Quiz use case resembles a Norwegian theory exam but measures cumulative learning rather than an exam score.
- Conversation fact: the Learner accepts a full database restart and does not require any v1 data or configuration to survive.
- Conversation fact: the Learner accepts public unauthenticated v2 access and plans to introduce simple authentication later.
- Explicit assumption: exact URL strings and visual styling are reversible implementation details as long as navigation remains collection-first and routes are scoped by Deck or Quiz identity.
- Explicit assumption: automatic translation and image upload remain synchronous interactive form steps; the UI must make their pending and retry states clear.
- Explicit assumption: Flashcard edit behavior continues to preserve Recall Streak, matching the agreed no-reset behavior for Quiz Question edits.
- The accepted architectural decisions for Google Cloud Translation, Railway Bucket storage, and deferred authentication govern implementation where this PRD does not repeat operational detail.
- The temporary v2 rollout checklist is removed after the clean database cutover and verification are complete.
