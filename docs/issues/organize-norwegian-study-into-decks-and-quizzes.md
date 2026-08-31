---
title: Organize Norwegian study into Flashcard Decks and Quizzes
labels:
  - completed
prd: ../prd/norwegian-learning-v2.md
status: completed
---

# Organize Norwegian study into Flashcard Decks and Quizzes

## Summary

Build the v2 single-Learner experience described in the linked PRD. The Learner must be able to organize Flashcards into independent Decks and create independent theory-style Quizzes with learner-authored Norwegian Questions, automatic exact-match grading, editable Google-generated English Translation Help, optional Railway-hosted Question Images, adaptive learning progress, and collection-scoped study.

## Acceptance Criteria

- [x] Top-level navigation exposes separate Flashcard Deck and Quiz destinations, and all study and content actions begin from a selected collection.
- [x] Collection names are required and normalized for case and whitespace uniqueness within their own type while preserving Norwegian letters and allowing matching Deck/Quiz names.
- [x] Every Flashcard belongs to exactly one Deck; no default or unassigned Deck exists.
- [x] Manual Flashcard creation, Source Text generation, retry, Card Draft review, and approval remain scoped to the selected Deck.
- [x] Deck study preserves the existing self-assessed Front/Back workflow, Recall Streak, weighted selection, and Retry Gap behavior.
- [x] Deck detail and Flashcard management show independent Deck Progress plus subtle per-card `0/3` through `3/3` status.
- [x] Every Quiz Question belongs to exactly one Quiz and can be added individually with a fast Save-and-add-another path.
- [x] Each Question requires a Norwegian prompt, at least two text options, and at least one correct option.
- [x] Exactly one correct option derives single-select controls; multiple correct options derive multi-select controls with exact-match grading and no partial credit.
- [x] Answer Options retain authored management order and are shuffled on every study presentation.
- [x] New and changed Norwegian Question text is translated to editable English through a provider-neutral Google Cloud Translation adapter before save.
- [x] A Google translation failure retains entered content and permits complete learner-authored English fallback.
- [x] Translation Help displays retained English as primary text with smaller Norwegian originals and never calls Google during study.
- [x] Using Translation Help makes the resulting Quiz Result Incorrect and shows a compact translation-used indicator.
- [x] A Question may have one optional JPEG, PNG, WebP, or GIF uploaded to a private Railway Bucket.
- [x] The image form shows file size, warns above 5 MB, rejects unsupported types and files above 25 MB, and never translates image content.
- [x] Image upload and read use short-lived presigned URLs; stable object keys and metadata persist in PostgreSQL.
- [x] Replaced or deleted image objects are cleaned up best-effort without blocking content changes.
- [x] Quiz study records automatic Correct or Incorrect results, locks submitted choices, highlights correct and incorrectly selected options, and waits for Next Question.
- [x] Correct results increment Recall Streak to three; Incorrect or translation-assisted results reset it to zero.
- [x] Quiz scheduling uses `4/3/2/1` weights, a three-other-question Retry Gap, and the documented tiny-collection fallback inside the selected Quiz only.
- [x] Quiz detail and Question management show independent Quiz Progress plus subtle per-question `0/3` through `3/3` status.
- [x] Empty collections show dedicated empty states, and 100%-Learned collections remain studyable without progress reset.
- [x] Quiz Results persist only idempotency identity, nullable Question reference, outcome, Translation Help use, and timestamp; selected options and content snapshots are not retained.
- [x] Result insertion and Recall Streak mutation are atomic and idempotent for both study formats.
- [x] Individual and collection deletion remove active content and progress while retaining detached append-only Result history.
- [x] Collection deletion requires confirmation showing the active item count; Question Image cleanup remains best-effort.
- [x] The responsive interface is comfortable on phone and desktop and keeps progress or translation indicators visually restrained.
- [x] PostgreSQL, OpenAI, Google Cloud Translation, and Railway Bucket credentials remain server-side with clear configuration validation.
- [x] Authentication remains out of scope, and the accepted public-access risks remain documented.
- [x] V2 runs against a completely fresh database with the Default Generation Template and no default Deck, Quiz, v1 data, or v1 configuration.
- [x] Deterministic domain, workflow, provider-contract, PostgreSQL integration, component, and phone-sized end-to-end tests cover the behaviors named in the PRD without live external calls during normal test runs.
- [x] Flashcard Deck restructuring and Quiz functionality pass release verification before the single v2 production cutover.

## Module Breakdown

1. Adaptive Learning Core: Recall Streak, Retry Gap, weighted selection, and progress calculation shared as policy without shared collection data.
2. Flashcard Deck Workflows: Deck lifecycle, Flashcard ownership, generation targeting, study, and Deck Progress.
3. Quiz Workflows: Quiz and Question lifecycle, Answer Options, grading, Translation Help, feedback, results, scheduling, and Quiz Progress.
4. Translation Boundary: provider-neutral translation interface and Google Cloud Translation adapter.
5. Question Image Boundary: validation, Railway presigned upload/read, metadata, and best-effort cleanup.
6. Persistence Boundary: repository contracts, Drizzle/PostgreSQL schema, required relationships, transactions, idempotency, and retained history.
7. Next.js Interface and Release: collection-first responsive UI, Server Actions and narrow presigning routes, configuration, and clean cutover.

## Verification

- Unit-test adaptive learning, grading, naming, progress, and shuffle behavior deterministically.
- Test Deck and Quiz workflows through fake persistence, translation, generation, and image boundaries.
- Contract-test Google Translation and Railway-compatible storage adapters without live service calls.
- Integration-test real migrations, constraints, transactions, cascade/detach behavior, and collection scoping against PostgreSQL.
- Component-test creation, translation, images, study feedback, progress, empty states, and deletion confirmation.
- Exercise one critical phone-sized Deck journey and one critical phone-sized Quiz journey.
- Apply the complete schema and smoke-test both collection types against a clean deployed database before cutover.

## References

- [Product requirements](../prd/norwegian-learning-v2.md)
- [Domain language](../../CONTEXT.md)
- [PostgreSQL and Railway decision](../adr/0001-use-postgresql-on-railway.md)
- [LLM provider boundary decision](../adr/0002-isolate-llm-providers-behind-a-generation-interface.md)
- [Google Translation decision](../adr/0003-use-google-cloud-translation-behind-a-translation-interface.md)
- [Question Image storage decision](../adr/0004-store-question-images-in-railway-buckets.md)
- [Deferred authentication decision](../adr/0005-defer-authentication-for-single-learner-v2.md)
- [Production browser test guide](../playwright-release-test.md)
