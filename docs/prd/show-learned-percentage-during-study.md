# Show the learned percentage during study

## Problem Statement

As the Learner, I can see how much of a Flashcard Deck or Quiz is Learned in its collection detail view, but I lose that visibility while testing myself. I want to see the collection's current learned percentage during study without leaving the question or card and without distracting from answering.

## Solution

Show a small, muted label such as “25% Learned” directly below the collection name, outside the study card. Use the same collection-wide percentage and whole-number rounding as the collection detail view. The label scrolls with the study content and remains secondary to the prompt and answer controls.

Update the label as soon as a Study Result or Quiz Result is successfully recorded. Quiz Progress updates while Answer Feedback is visible, before the Learner chooses Next Question. Deck Progress updates with the existing automatic transition to the next Flashcard. Pending or failed saves leave the displayed percentage unchanged.

## User Stories

1. As the Learner, I want to see Deck Progress while studying Flashcards, so that I can track learning without returning to the Deck detail view.
2. As the Learner, I want to see Quiz Progress while answering Quiz Questions, so that I can track learning without interrupting my study.
3. As the Learner, I want the study percentage to use the same definition and rounding as the collection detail view, so that both views communicate the same measure.
4. As the Learner, I want progress to include every active item in the selected collection, so that it describes the whole collection even when some items have not appeared in this session.
5. As the Learner, I want other Decks and Quizzes excluded from this percentage, so that I see progress for the collection I am studying.
6. As the Learner, I want the initial percentage visible before answering, so that I know my starting progress.
7. As the Learner, I want a compact, muted percentage directly below the collection name, outside the study card, so that I can find it without it competing with the study task.
8. As the Learner, I want the percentage to scroll with the content, so that it does not cover a long question, image, translation, or answer control.
9. As the Learner, I want a third consecutive correct result to update the percentage immediately after saving, so that becoming Learned is reflected promptly.
10. As the Learner, I want an incorrect result on a Learned item to reduce progress after saving, so that the percentage reflects my current Recall Streaks.
11. As the Learner, I want correct results below the Learned threshold to leave the percentage unchanged, so that progress continues to mean Learned items rather than answers attempted.
12. As the Learner, I want Quiz Progress to update alongside Answer Feedback while the current question stays visible, so that I can see the effect before choosing Next Question.
13. As the Learner, I want moving to the next question to retain the updated percentage without counting the previous answer again, so that progress remains accurate.
14. As the Learner, I want revealing a Flashcard, selecting Answer Options, or requesting Translation Help alone to leave progress unchanged, so that only recorded results affect it.
15. As the Learner, I want a saved translation-assisted answer to follow the existing incorrect-result policy, so that Translation Help never falsely advances learning.
16. As the Learner, I want the percentage unchanged while saving or after a save failure, so that the display does not claim an unconfirmed result.
17. As the Learner, I want a successful retry to reflect the recorded result once, so that recovery from a failed request does not inflate progress.
18. As the Learner, I want 0% Learned visible for a non-empty collection with no Learned items and 100% Learned visible for a fully learned collection, so that the indicator covers the full learning range.
19. As the Learner, I want to continue studying at 100% Learned, so that the indicator does not end review or reset learning.
20. As the Learner, I want empty collections to keep their existing empty states without a percentage, so that there is no misleading progress indicator when nothing is available to study.
21. As the Learner, I want the percentage readable on phone and desktop without moving keyboard focus, so that checking progress does not interrupt answering.
22. As the Learner, I want re-entering study to load persisted progress, so that the percentage continues to reflect saved learning across visits.

## Implementation Decisions

- **Flashcard study module:** extend the existing study session presentation to display Deck Progress from its collection of Flashcards. Apply the returned Recall Streak after a successful assessment using the existing save-and-advance flow, then render the updated percentage with the next card.
- **Quiz study module:** extend the existing study session presentation to display Quiz Progress. Incorporate the successfully returned Recall Streak into the displayed collection progress immediately alongside Answer Feedback. Keep question advancement and Retry Gap scheduling tied to Next Question. Advancing must use the updated streak without applying the result twice.
- **Shared learning policy:** reuse the existing progress calculator. Learned means Recall Streak exactly three; percentage is Learned items divided by all active collection items, multiplied by 100 and rounded to the nearest whole number. Preserve current collection-detail rounding even where a large collection's rounded display reaches 100 before every item is Learned.
- Both sessions already receive the selected collection's study items and their Recall Streaks. Compute progress across that full collection, including Learned items, items not yet shown, and items temporarily held back by the Retry Gap. Do not compute progress from the current prompt or eligible scheduling subset.
- Existing successful save responses already contain the updated Recall Streak. Treat the recorded response as authoritative rather than predicting the streak from the chosen answer or self-assessment. No extra progress request, endpoint, database field, migration, or provider integration is required.
- Use the same visible format, “25% Learned”, in both study views. Place it directly below the collection name, outside the study card with small, readable, muted text and normal document flow. Preserve readable contrast and existing keyboard focus. No progress bar, sticky positioning, overlay, animation, or new interaction is required.
- Keep progress visible through prompt, revealed answer, translation, pending submission, error, and Quiz Answer Feedback states when a study item is present. Only a successfully recorded result changes its value.
- Preserve Quiz Answer Option order, selected answers, translation state, current prompt, image, and feedback when progress changes. Updating progress must not reshuffle options or advance the question.
- Retain the existing Flashcard automatic advancement, Quiz explicit advancement, save error/retry behavior, attempt idempotency, grading, Recall Streak rules, and collection scoping. Existing empty collection views remain authoritative and omit the percentage.
- Reaching 100% does not end study, reset progress, retire items, or trigger a new completion flow.
- Preserve the existing single-Learner access model and persistence contracts. This display feature introduces no permissions or authentication behavior.

## Testing Decisions

- The Learner confirmed the two-module breakdown and explicit behavior tests for both Flashcard study and Quiz study, plus a focused phone-layout check.
- Assert visible text and user-observable transitions through rendered sessions and fake save actions. Avoid assertions about private state, helper invocation counts, component nesting, or exact styling classes.
- Follow the existing study component tests using Testing Library and user-event, with deterministic item fixtures and scheduling where needed. Existing Flashcard save-failure and continuation tests, Quiz feedback/Next Question and pending-control tests, and collection-detail progress tests provide prior art.
- Cover initial full-collection percentages in both views, including non-empty 0%, partial progress with whole-number rounding, and 100%. Use a collection containing items beyond the current prompt to establish that all collection items contribute.
- Cover a saved streak transition from two to three increasing progress, from three to zero decreasing it, and transitions below three leaving it unchanged. Confirm continued study at 100%.
- For Quiz study, assert the new percentage before clicking Next Question, with the same question, option order, selected answers, and Answer Feedback still visible. Then advance and assert the percentage remains correct without a second change.
- For Flashcard study, assert the updated percentage after the saved assessment and automatic advancement. Revealing the back alone must not change it.
- Use deferred and rejected fake save responses to verify that pending and failed saves preserve progress. Then verify a successful retry reflects the returned streak once. Answer selection and requesting Translation Help alone must not change Quiz Progress; a saved translation-assisted incorrect result must follow the returned streak.
- Retain or extend existing empty-state coverage to confirm empty collections omit the percentage. Reuse existing progress-policy and persistence tests; new database or provider tests are unnecessary unless implementation changes those boundaries.
- Perform a focused phone and desktop visual check with short and long study content. Verify readable, subdued placement directly below the collection name, outside the study card, ordinary scrolling, and no overlap with images, translations, feedback, or answer controls. Use local fixtures or an isolated test environment.
- Complete the repository's standard lint, test, and build checks during implementation. Normal verification must not require live translation, image storage, or production database access.

## Out of Scope

- Changes to the Learned threshold, percentage formula or rounding, grading, Recall Streaks, adaptive selection, or Retry Gap policy.
- Session scores, answer counts, new statistics, progress bars, celebrations, animation, or completion screens.
- A redesign of collection detail views or study layouts beyond the compact label.
- Live synchronization of edits or study activity from another tab or device during an already open session.
- New storage, APIs, external services, authentication, migrations, or deployment work.

## Further Notes

- **Conversation facts:** the Learner requested the existing learned percentage in both study formats, explicitly chose immediate updates after saved answers, and accepted a subtle label directly below the collection name, outside the study card that scrolls normally. The Learner confirmed the module and testing scope.
- **Repository facts:** both detail views already use shared learning-progress policy. Flashcard study applies the returned streak when saving and advancing; Quiz study currently stores feedback at save time and applies the streak when advancing. The Quiz timing therefore needs particular attention to meet the immediate-update requirement without disturbing feedback or option order.
- **Explicit assumption — other sessions:** the initial collection snapshot and results saved in the current session determine the visible percentage. Existing page loading retrieves persisted state on a later visit; this feature adds no polling or cross-device synchronization.
- This is a small presentation and session-state change. The domain glossary already records the agreed behavior; no new ADR is needed for this reversible UI decision.
