# Plan: Show the learned percentage during study

> Source PRD: [Show the learned percentage during study](../docs/prd/show-learned-percentage-during-study.md)
>
> Tracking issue: [Show the learned percentage during study](../docs/issues/completed/show-learned-percentage-during-study.md)

The Learner approved two vertical slices: complete Flashcard study progress first, then complete Quiz study progress. Each phase includes its own rendered behavior tests and responsive visual verification.

## Architectural decisions

Durable decisions that apply across both phases:

- **Routes and collection boundaries:** extend the existing `/decks/{deckId}/study` and `/quizzes/{quizId}/study` experiences. A study session targets exactly one Flashcard Deck or Quiz. Use every active item in that selected collection, including items not yet shown and items temporarily in the Retry Gap.
- **Progress policy:** reuse the existing collection-detail calculation. An item is Learned at Recall Streak exactly three. Display Learned items divided by all active collection items, multiplied by 100 and rounded to the nearest whole number. Preserve existing rounding, including its behavior near 100% for large collections.
- **Presentation:** show a small, readable, muted label such as “25% Learned” directly below the collection name, outside the study card. Keep it in normal document flow so it scrolls with the content. Preserve keyboard focus and readable contrast. Empty collections retain their existing empty states without a percentage.
- **Recorded results:** use the updated Recall Streak returned by the existing successful save operation. Pending or failed saves leave progress unchanged; do not predict a result from the Learner's selection. A successful retry reflects the recorded result once.
- **Study transitions:** Flashcard study continues to save and advance automatically. Quiz study updates progress alongside Answer Feedback and waits for Next Question before advancing or updating scheduling. Progress changes must preserve the displayed question, answer order, selections, translation, image, and feedback.
- **Persistence and schema:** retain the existing Flashcard, Quiz Question, Study Result, and Quiz Result models, atomic recording, and attempt idempotency. No migration, new persisted percentage, or additional progress endpoint is needed.
- **Learning behavior:** retain existing grading, Translation Help assessment, Recall Streak transitions, and adaptive selection. Reaching 100% does not stop study, reset progress, or retire items.
- **Access and external services:** preserve the existing single-Learner access model. No new authentication or external integration is required. Existing retained translations and image handling remain independent of the percentage display.
- **Verification boundary:** test visible behavior with rendered sessions, deterministic fixtures, and fake save actions. Reuse existing progress-policy and persistence coverage. Use local fixtures or an isolated environment for visual checks; normal verification must not depend on live translation, storage, or production data.

### Evidence and assumptions

- **Repository facts:** both study views already receive their collection's items and Recall Streaks, and successful saves return the updated streak. Flashcard study applies it during automatic advancement. Quiz study currently retains the result as feedback and applies the streak when Next Question is chosen.
- **PRD requirements:** both views must display the same collection-wide learned percentage as their detail views and update immediately after successful saves. In particular, Quiz Progress must update before Next Question without changing the current answer presentation.
- **Planning inference:** existing contracts are sufficient; the work belongs in the two study experiences, with no backend feature phase required. UI code sharing is an implementation choice rather than a separate milestone.
- **Accepted assumption:** initial collection data plus confirmed results from the current session determine the display. Re-entering study loads persisted progress through the existing flow. Live synchronization with another open tab or device is out of scope.

---

## Phase 1: Learned percentage during Flashcard study

**User stories**: 1, 3–11, 14, 16–22, as applicable to Flashcard study.

### What to build

Complete the path from opening a Deck's study view through revealing, assessing, saving, and continuing with the next Flashcard. Show full Deck Progress directly below the collection name, outside the study card from the initial collection data, then refresh it from confirmed Recall Streaks during the existing automatic advancement. Preserve the current percentage through pending saves and recoverable errors.

This slice is demoable with a partially Learned Deck: reveal a card at Recall Streak two, save a correct assessment, and see the increased percentage with the next card. An incorrect assessment on a Learned Flashcard reduces the percentage after saving.

### Acceptance criteria

- [x] Opening a non-empty Deck's study view immediately displays the same whole-number progress as its detail view, calculated across the complete selected Deck rather than the current or eligible cards.
- [x] A small, muted “25% Learned” label appears directly below the collection name, outside the study card and remains visible through front, revealed back, pending save, and error states, using normal page scrolling.
- [x] A saved transition from Recall Streak two to three increases progress; three to zero decreases it. Results that leave the card below three, or already at three, preserve the correct percentage.
- [x] Successful assessment retains existing automatic advancement and displays updated progress with the next card. Revealing the back alone does not affect progress.
- [x] A pending or rejected save leaves progress unchanged and preserves the current card for recovery. A successful retry uses the returned streak once and continues study normally.
- [x] Non-empty 0%, partial progress with whole-number rounding, and 100% are supported. Study continues at 100%, including in a one-card Deck. Empty Decks show their existing empty state and no percentage.
- [x] Re-entering study displays progress from newly loaded persisted collection state through the existing load contract, with no dependence on prior browser session state.
- [x] Rendered behavior tests cover the initial full-collection denominator, rounding, threshold transitions, reveal-only behavior, deferred saves, failure and retry, automatic advancement, and continuation at 100%. Retain or extend empty-state coverage through the existing page boundary.
- [x] A phone and desktop visual check confirms readable, unobtrusive placement, stable existing focus behavior, and ordinary scrolling with long fronts and revealed backs.

---

## Phase 2: Learned percentage during Quiz study

**User stories**: 2–22, as applicable to Quiz study.

### What to build

Complete the corresponding Quiz experience using the same percentage semantics and restrained presentation. When an answer is successfully recorded, display the returned progress immediately alongside Answer Feedback while retaining the current question and answer presentation. Next Question then advances using the updated streak without counting the result twice. Include Translation Help outcomes and save recovery in this complete path.

This slice is demoable with a question at Recall Streak two: submit a correct answer, see progress increase while that question's Answer Feedback remains visible, then choose Next Question and verify the percentage stays correct. Repeat with a Learned Question answered incorrectly or with Translation Help to see progress decrease only after saving.

### Acceptance criteria

- [x] Opening a non-empty Quiz's study view displays the same rounded percentage as its detail view, including every active question in the selected Quiz, even those not yet shown or temporarily in the Retry Gap.
- [x] The label matches Flashcard study in wording and visual emphasis, appears directly below the collection name, outside the study card, and stays visible through untranslated and translated prompts, pending submission, errors, and Answer Feedback.
- [x] A successful save updates progress immediately using the returned Recall Streak, before Next Question is chosen. Tests assert increases, decreases, and unchanged Learned status while feedback is still visible.
- [x] Updating progress preserves the current prompt, answer order, selected options, Translation Help state, image, and Answer Feedback. It does not choose a new question or reshuffle options.
- [x] Choosing Next Question retains the updated percentage and applies existing scheduling once using the updated streak. Existing single-choice and multiple-choice answer flows continue to work.
- [x] Selecting answers or requesting Translation Help alone does not change progress. A saved translation-assisted answer follows the existing incorrect-result policy and removes Learned status when applicable.
- [x] Pending and failed saves leave progress unchanged. A failed save remains retryable; a successful retry reflects the recorded streak once without advancing before Next Question.
- [x] Non-empty 0%, rounded partial progress, and 100% are supported. Study continues at 100%, including a one-question Quiz. Empty Quizzes retain their existing empty state without a percentage.
- [x] Re-entering study derives progress from newly loaded persisted questions through the existing load contract. No polling or cross-session synchronization is introduced.
- [x] Rendered tests verify immediate feedback-time updates, stable answer presentation, subsequent advancement without double-counting, Translation Help, pending/failure/retry behavior, and initial/empty/fully Learned states. Use existing grading and persistence tests for unchanged lower-level behavior.
- [x] A phone and desktop visual check covers long prompts, answer lists, translations, an image, and feedback. The label scrolls normally, remains readable, and does not overlap controls or disturb existing focus behavior.
- [x] Run the repository's standard lint, test, and build checks after implementation. Resolve new failures, distinguish any pre-existing limitations with evidence, and record actual verification results in this plan. Do not mark a blocked check as passed.
- [x] Review the complete implementation against the PRD and update this plan and the tracking issue to reflect the verified result.

## Implementation verification — 2026-09-07

- Both study sessions reuse the existing learning-progress calculator and render a muted 14px label directly below the collection name, outside the study card.
- Flashcards use the existing saved-and-advanced collection state. Quizzes include the confirmed feedback streak in the calculation before Next Question, preserving the current question object and answer order.
- A rendered retry test exposed the existing quiz form reset clearing a selected answer after failure. The form now remounts into a retry state from the retained selection, allowing the same attempt to be retried directly.
- Red/green cycles verified the initial Flashcard label, initial Quiz label, immediate Quiz feedback update, and failed Quiz save recovery. Additional regression cases verify threshold increases/decreases, unchanged progress, pending saves, Translation Help, continuation at 100%, and empty study pages.
- Focused tests: 24 passed across the two sessions and empty-page boundary. Full suite: 336 tests passed across 62 files. `bun run lint` and `bun run build` passed.
- Local Chromium fixtures at 390px and 1440px passed visual inspection with long fronts/backs, translated prompts, answer lists, an image, and feedback. No horizontal overflow; labels remain in normal flow and scroll with the content. Temporary fixture files were removed.
- Existing route loading and persistence contracts were reviewed for fresh-entry progress and collection scope; no additional fetching or persistence changes were introduced.
- CodeRabbit: `cr review --agent` completed successfully. Its single finding alleged duplicate declarations of `resolveSave` and `action` in the Flashcard test. Rejected as a false positive: each is declared once in that test scope; other `action` declarations belong to separate test callbacks. The focused and full suites passed. Accepted findings: none. No review-driven code changes or verification rerun were needed. The review reported the five tracked changed files; the new empty-page test and planning documents were also checked locally.

### Placement adjustment — 2026-09-07

Moved the live percentage directly below the collection heading, before the study instructions and outside the question card. The session still owns the progress calculation and renders the page-provided instructions after the label. Empty-state instructions remain in place. The existing 24 focused tests, lint, and production build passed. CodeRabbit (`cr review --agent`) completed with zero findings; no review-driven changes or test rerun were needed. The earlier responsive screenshots document the original placement.
