---
title: Create and study Norwegian flashcards from source text
labels:
  - completed
prd: ../prd/norwegian-flashcards-v1.md
status: completed
---

# Create and study Norwegian flashcards from source text

## Summary

Build the v1 single-Learner application described in the linked PRD. The Learner must be able to create Norwegian-to-English Flashcards manually or from editable, source-grounded LLM Card Drafts, remove unwanted drafts, add everything remaining, then study with a simple priority system that repeats difficult cards without immediate repetition.

## Acceptance Criteria

- [x] The application runs as a responsive Next.js App Router experience suitable for phone and desktop.
- [x] The Learner can create, edit, list, and delete a Flashcard with a required Norwegian Front and English Back.
- [x] The Learner can paste chapter- or unit-sized Source Text and synchronously generate a complete Card Draft collection.
- [x] OpenAI is integrated behind the provider-neutral generation interface and returns strictly structured Front/Back pairs.
- [x] The Default Generation Template produces source-grounded selections and avoids unrelated material and duplicate drafts.
- [x] Customized Generation Instructions persist and can be reset to the bundled template.
- [x] A failed Generation Attempt creates no partial drafts, retains its Source Text, and can be retried.
- [x] The Learner can edit or remove pending Card Drafts, then add every remaining draft in one action.
- [x] Adding remaining Card Drafts is idempotent, creates exactly one Flashcard per draft, and preserves Source Text traceability.
- [x] Study shows the Front first, reveals the Back on request, and records Correct or Incorrect self-assessment.
- [x] Correct results increase Recall Streak to a maximum of three; Incorrect results reset it to zero.
- [x] Weighted selection favors lower-streak Flashcards while keeping three-streak Flashcards eligible.
- [x] An incorrectly answered Flashcard cannot return until three other Flashcards have been studied, with the documented tiny-collection fallback.
- [x] Flashcards, Source Texts, Card Drafts, Generation Instructions, Study Results, and Recall Streaks use durable PostgreSQL persistence across phone and desktop.
- [x] Drizzle ORM remains inside the PostgreSQL adapter, with versioned Drizzle Kit migrations.
- [x] Database credentials and the OpenAI API key remain server-side in deployment configuration.
- [x] Retryable user-facing errors are concise, while diagnostic details are available in server logs.
- [x] The confirmed unit, workflow, adapter, persistence, and critical browser tests pass.
- [x] The application is smoke-tested against Railway PostgreSQL from its Vercel deployment.

## Module Breakdown

1. Learning Domain: Flashcards, Study Results, Recall Streak, Retry Gap, and weighted selection.
2. Application Workflows: manual entry, generation and retry, draft review, settings, and study recording.
3. Generation Boundary: provider-neutral interface and OpenAI Structured Outputs adapter.
4. Persistence Boundary: repository interfaces and the Drizzle/PostgreSQL adapter.
5. Next.js Interface: responsive screens and Server Actions for Learner-triggered mutations.

## Verification

- Unit-test the learning rules with deterministic selection.
- Test workflows against fake ports.
- Contract-test the OpenAI adapter without live API calls.
- Integration-test migrations, constraints, and transactions against PostgreSQL.
- Exercise the critical generate, edit, add-remaining, and study flow at a phone-sized viewport.

## References

- [Product requirements](../prd/norwegian-flashcards-v1.md)
- [Domain language](../../CONTEXT.md)
- [PostgreSQL and Railway decision](../adr/0001-use-postgresql-on-railway.md)
- [LLM provider boundary decision](../adr/0002-isolate-llm-providers-behind-a-generation-interface.md)
- [V1 implementation plan](../v1-implementation-plan.md)
