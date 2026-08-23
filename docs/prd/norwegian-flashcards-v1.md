# Norwegian Flashcards v1

## Problem Statement

As a learner preparing with Norwegian curriculum material, I need a fast way to turn chapters or units into useful Norwegian-to-English flashcards and repeatedly study the material from my phone or desktop. Writing every card manually is slow, while unreviewed LLM output may contain poor selections or translations. Existing general-purpose flashcard systems also introduce more structure than this first version needs.

I need one persistent personal study collection, without an account system, that helps difficult cards return more often while preventing an incorrectly answered card from repeating immediately.

## Solution

Provide a phone-friendly, single-Learner Next.js application with two Add Flashcard paths. The Learner may write a Norwegian Front and English Back manually, or paste Norwegian Source Text and synchronously generate source-grounded Card Drafts with an LLM. Generated drafts are assumed useful by default: the Learner may edit or remove exceptions, then add every remaining draft to storage in one action.

During study, the application shows the Norwegian Front, reveals the English Back on request, and records the Learner's Correct or Incorrect self-assessment. A simple scheduler favors cards with a lower Recall Streak. An Incorrect result resets the streak and gives the card higher priority after a three-card Retry Gap; three consecutive Correct results reduce its frequency without removing it from study.

All durable state is stored in PostgreSQL so the same material and progress are available from phone and desktop. OpenAI is the initial generation provider, but application behavior depends on a provider-neutral generation interface so additional providers can be introduced later.

## User Stories

1. As the Learner, I want to open the application from my phone or desktop, so that I can use the same learning collection wherever I study.
2. As the Learner, I want to add a Flashcard manually, so that I can capture material without invoking an LLM.
3. As the Learner, I want a manual Flashcard to require a Norwegian Front and an English Back, so that incomplete cards do not enter study.
4. As the Learner, I want a manually saved Flashcard to become immediately studyable, so that manual entry remains fast.
5. As the Learner, I want to edit an existing Flashcard, so that I can correct wording or translations after saving it.
6. As the Learner, I want to delete an existing Flashcard, so that unwanted material no longer appears during study.
7. As the Learner, I want to paste chapter- or unit-sized Norwegian Source Text, so that I can generate learning material without processing an entire book.
8. As the Learner, I want the application to retain my Source Text, so that failed generation can be retried and generated cards remain traceable to their origin.
9. As the Learner, I want the LLM to select useful Norwegian words, phrases, and short sentences from the Source Text, so that generated material focuses on learnable content.
10. As the Learner, I want every generated Card Draft to contain one Norwegian Front and one English Back, so that stored generated cards match the simple v1 Flashcard model.
11. As the Learner, I want generation to stay grounded in the supplied Source Text, so that unrelated facts or vocabulary are not introduced.
12. As the Learner, I want generation to permit light normalization of Norwegian wording, so that a selected word or phrase can be useful outside its original sentence when appropriate.
13. As the Learner, I want generated fronts to remain understandable outside their paragraph, so that I can study them independently.
14. As the Learner, I want one Generation Attempt to finish while I wait, so that v1 does not require background jobs or a separate queue.
15. As the Learner, I want to see a clear loading state during generation, so that I know the request is still in progress.
16. As the Learner, I want a successful Generation Attempt to save its complete draft collection together, so that I never review an unexplained partial result.
17. As the Learner, I want a failed Generation Attempt to save no partial drafts, so that retrying does not create duplicate or incomplete output.
18. As the Learner, I want failed Source Text to remain available for retry, so that a provider or network failure does not make me paste it again.
19. As the Learner, I want provider failures, refusals, and incomplete responses presented as concise retryable errors, so that technical details do not interrupt studying.
20. As the Learner, I want to inspect generated Card Drafts before they become Flashcards, so that I can remove or correct exceptions.
21. As the Learner, I want to edit the Front or Back of a pending Card Draft, so that I can correct a useful but imperfect suggestion.
22. As the Learner, I want one action to add every remaining Card Draft, so that confirming a mostly correct generated collection is fast.
23. As the Learner, I want repeated add submissions to remain idempotent, so that double taps or retries cannot create duplicate Flashcards.
24. As the Learner, I want to remove a Card Draft, so that irrelevant or incorrect output never enters study.
25. As the Learner, I want stored generated Flashcards to retain their relationship to the originating Source Text, so that generated material remains traceable.
26. As the Learner, I want to inspect and edit the Generation Instructions in the application, so that I can influence what the LLM selects.
27. As the Learner, I want customized Generation Instructions reused for future Generation Attempts, so that I do not repeat the same customization.
28. As the Learner, I want to reset Generation Instructions to the bundled Default Generation Template, so that experiments are always reversible.
29. As the Learner, I want the Default Generation Template to avoid duplicate or near-duplicate drafts in one result, so that review time is not wasted.
30. As the Learner, I want to browse all saved Flashcards, so that I can inspect and maintain my study collection.
31. As the Learner, I want to begin a study session without configuring a deck or daily limit, so that studying remains immediate in v1.
32. As the Learner, I want study to show only the Norwegian Front initially, so that I can attempt recall before seeing the translation.
33. As the Learner, I want to reveal the English Back when ready, so that I can compare it with the answer I had in mind.
34. As the Learner, I want to mark my answer Correct or Incorrect myself, so that valid alternative translations are not rejected by automatic grading.
35. As the Learner, I want a Correct Study Result to increase the Flashcard's consecutive Recall Streak, so that repeated success gradually lowers its study priority.
36. As the Learner, I want the Recall Streak capped at three, so that the first version has a clear and simple mastery threshold.
37. As the Learner, I want an Incorrect Study Result to reset the Recall Streak to zero, so that a forgotten card becomes important again.
38. As the Learner, I want an incorrectly answered Flashcard excluded until three other Flashcards have been studied, so that it does not reappear immediately.
39. As the Learner, I want a zero-streak Flashcard to return at the highest priority after its Retry Gap, so that difficult material receives more practice.
40. As the Learner, I want every available alternative shown before an incorrect card returns when fewer than three alternatives exist, so that tiny collections remain usable without immediate repetition.
41. As the Learner, I want eligible Flashcards selected with weighted variation, so that difficult cards appear more often without creating a predictable fixed order.
42. As the Learner, I want a three-streak Flashcard to remain eligible at reduced frequency, so that familiar material is still refreshed occasionally.
43. As the Learner, I want each Study Result retained, so that current scheduling state has an auditable history.
44. As the Learner, I want my Recall Streaks to persist after refreshing or changing devices, so that study progress is not tied to one browser session.
45. As the Learner, I accept that the short Retry Gap itself resets with the current study session, so that the application can keep v1 session handling simple.
46. As the Learner, I want forms and study controls sized for a phone, so that the primary study interaction is comfortable on a small screen.
47. As the Learner, I want database and provider credentials to remain invisible in the browser, so that secrets are not exposed through the UI.
48. As the operator, I want provider and database configuration supplied through deployment settings, so that secrets and model choices are not committed with application code.
49. As the operator, I want database changes applied through versioned migrations, so that deployments have a repeatable schema state.
50. As the operator, I want detailed generation failures recorded in server logs while the Learner sees a concise error, so that failures can be diagnosed without leaking internals.
51. As the operator, I want a missing database URL, API key, or model configuration treated as a deployment error, so that misconfiguration fails clearly.
52. As the sole Learner, I accept that the generated Vercel URL is publicly reachable in v1, so that account and access-control work does not block the first useful release.

## Implementation Decisions

- The application is a greenfield Next.js 16 App Router application written in TypeScript and deployed to Vercel using the Node.js runtime.
- The product has exactly one implicit Learner in v1. There are no accounts, user records, ownership checks, or per-user data partitions.
- The Next.js interface uses Server Components for reads and Server Actions for UI-triggered mutations. Route Handlers are deferred until an external caller or webhook requires an HTTP API.
- The Learning Domain module owns Flashcard behavior, Recall Streak transitions, Retry Gap rules, and weighted study selection without depending on Next.js, Drizzle, PostgreSQL, or an LLM SDK.
- The Application Workflows module coordinates manual creation, synchronous generation and retry, draft review, idempotent approval, Generation Instructions, and recording Study Results through stable ports.
- The Generation Boundary exposes a provider-neutral operation that accepts Source Text plus Generation Instructions and returns a complete collection of Card Drafts. Provider-specific models, usage data, refusals, and error types do not cross the boundary.
- OpenAI is the initial generation adapter. It uses Structured Outputs so every successful result conforms to a strict collection of Norwegian Front and English Back pairs.
- The exact OpenAI model is deployment configuration rather than domain state. The OpenAI API key is available only to server-side code.
- The Persistence Boundary exposes repository operations in application and domain terms. Drizzle types and SQL concepts do not cross that boundary.
- PostgreSQL hosted on Railway is the durable source of truth. The Vercel application connects through Railway's external database endpoint because it is outside Railway's private network.
- Drizzle ORM provides typed PostgreSQL access within the adapter, and Drizzle Kit provides versioned migrations.
- The persistence schema contains Source Texts with generation status, Card Drafts with review status, Flashcards with a zero-to-three Recall Streak, append-only Study Results, and a singleton Generation Instructions setting.
- A manually created Flashcard has no Source Text. A Flashcard created from an approved Card Draft preserves its Source Text relationship.
- Card Draft status transitions from pending to approved or rejected. Adding the remaining collection approves each pending draft, creates exactly one Flashcard per draft, and records every association transactionally. Removing a draft records it as rejected.
- Source Text generation status distinguishes content ready to generate, successfully completed content, and failed content available for retry.
- A successful Generation Attempt saves its entire collection in one transaction. A failure saves no partial collection.
- The Default Generation Template is version-controlled with the application. The persisted customization is initialized from or reset to that template.
- The scheduler assigns decreasing selection weight to Recall Streaks zero, one, two, and three, initially using relative weights four, three, two, and one.
- An Incorrect result resets Recall Streak to zero. The three-card Retry Gap is enforced within the active study session; the persisted zero streak supplies high priority after a refresh or new session.
- Recording a Study Result and updating its Flashcard Recall Streak occur in one database transaction.
- The user interface supports manual entry, Source Text generation, Card Draft review, Flashcard management, Generation Instructions, and study. It is responsive and optimized for phone-sized use without introducing separate mobile application code.
- Source Text input is limited to chapter- or unit-sized content. Empty and unreasonably large input is rejected before provider invocation; the exact limit is a configurable guardrail.
- The generated Vercel URL is public by default. Access protection is an explicitly accepted v1 risk, not an accidental omission.

## Testing Decisions

- Good tests assert behavior visible through module contracts or the user interface. Tests should not depend on private function layout, Drizzle query construction, Next.js component internals, or OpenAI SDK implementation details.
- The Learning Domain module receives explicit unit tests using deterministic randomness. Coverage includes weight by Recall Streak, Correct increments, Incorrect resets, the three-card Retry Gap, re-entry priority, continued eligibility at streak three, and tiny collections.
- The Application Workflows module receives explicit behavior tests through fake persistence and generator implementations. Coverage includes manual creation, all-or-nothing generation, retained Source Text after failure, retry, draft editing, rejection, idempotent approval, settings persistence and reset, and atomic study-result behavior.
- The Generation Boundary receives contract tests that every adapter must satisfy. The OpenAI adapter is exercised with mocked or recorded structured responses for success, refusal, malformed or incomplete output, timeout, and provider error behavior.
- Automated tests do not call the live OpenAI API during normal local or continuous-integration runs. This keeps tests deterministic and avoids cost and credential requirements.
- The Persistence Boundary receives PostgreSQL integration tests after applying real Drizzle migrations. Tests cover constraints, relationships, transactions, cascades, singleton settings, source retention, idempotent approval, and concurrent duplicate submissions.
- The Next.js interface receives one critical end-to-end test at a phone-sized viewport: paste Source Text, generate drafts, edit one draft, add the remaining collection, begin study, mark a card Incorrect, and verify that three alternative positions appear. The deterministic scheduler test verifies that the incorrect card becomes eligible immediately after that Retry Gap; the browser test does not wait on random weighted reselection.
- Additional interface tests cover manual creation validation, retryable generation failure, editing and deleting a Flashcard, and reset of Generation Instructions when these behaviors cannot be covered more cheaply below the browser layer.
- Deployment verification includes applying migrations to a clean database and smoke-testing manual creation, generated creation, draft review, and study through the deployed application.
- The domain glossary, ADRs, PRD, implementation plan, and behavior-focused test suite are the authoritative v1 prior art for future changes.

## Out of Scope

- Accounts, authentication, authorization, and Vercel Deployment Protection.
- Custom domains and restricting the application to a private network.
- Multiple Learners, shared collections, or per-Learner ownership.
- Quizzes, automatic translation grading, and typed-answer comparison.
- Decks, tags, categories, search, sharing, import, and export.
- File or PDF upload, optical character recognition, and book-sized source processing.
- Background jobs, job queues, streaming draft creation, and partial generation results.
- Advanced spaced repetition, scheduled due dates, daily limits, reminders, and analytics.
- Bidirectional cards, configurable translation languages, audio, images, and richer card templates.
- Selecting or switching LLM providers in the UI. Additional adapters may be added later behind the generation interface.
- Offline study and browser-local synchronization.

## Further Notes

- Repository fact: v1 is implemented as a Next.js application with domain, workflow, adapter, persistence, interface, and release-browser tests.
- Conversation fact: the application serves one Learner preparing with Norwegian taxi-driver curriculum material, while the product model remains general enough for other Norwegian Source Text.
- Conversation fact: the Learner explicitly accepts the publicly reachable generated Vercel URL for v1.
- Explicit assumption: visual styling and component-library choices are reversible implementation details and are not fixed by this PRD.
- Explicit assumption: the model identifier and maximum Source Text size are configurable and can be tuned without changing domain behavior.
- Explicit assumption: the first release is successful when one curriculum unit can be converted into editable Card Drafts and studied from both phone and desktop with durable progress.
