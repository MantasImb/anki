---
title: Show the learned percentage during study
labels:
  - ready-for-agent
prd: ../../prd/show-learned-percentage-during-study.md
status: completed
---

# Show the learned percentage during study

## Summary

Implement the [product requirements](../../prd/show-learned-percentage-during-study.md). Show the active collection's learned percentage during both Flashcard and Quiz study as a small, muted “25% Learned” label directly below the collection name, outside the study card. Update it immediately after a successful save, including while Quiz Answer Feedback remains visible.

## Acceptance Criteria

- [x] Both study views show the percentage on initial load using the same Learned definition, full-collection denominator, and whole-number rounding as their collection detail views.
- [x] The label uses the format “25% Learned”, appears directly below the collection name, outside the study card, and scrolls normally with the content. It is readable but visually secondary on phone and desktop.
- [x] Progress includes all active items in the selected collection, including items not yet shown or temporarily in the Retry Gap, and excludes other collections.
- [x] A successfully saved result updates progress immediately using the returned Recall Streak. Becoming Learned increases it, losing Learned status decreases it, and results that do not change Learned status leave it unchanged.
- [x] Quiz Progress updates alongside Answer Feedback before Next Question. The current prompt, option order, selections, translation, image, and feedback remain stable.
- [x] Choosing Next Question preserves the updated percentage and applies scheduling once. Flashcard study retains automatic advancement after saving and shows the updated percentage with the next card.
- [x] Revealing a Flashcard, selecting options, or requesting Translation Help alone does not change progress. A saved translation-assisted Quiz Result follows the existing incorrect-result policy.
- [x] Pending or failed saves leave the percentage unchanged. A successful retry reflects the recorded result once and retains existing error recovery behavior.
- [x] Non-empty collections support 0% through 100% Learned. Study continues at 100% without resets or a new completion flow. Empty collections retain their existing empty states and omit the percentage.
- [x] Explicit rendered behavior tests cover both study modules, including immediate Quiz feedback updates and pending/failure/retry cases.
- [x] A focused phone and desktop layout check confirms subdued placement and ordinary scrolling with long content, translations, images, and feedback.
- [x] Standard lint, test, and build checks pass without requiring live external services or production data.

## Module Breakdown

The Learner confirmed this breakdown and explicit tests for both modules:

1. Flashcard study: display full Deck Progress and update it through the existing successful save-and-advance flow.
2. Quiz study: display full Quiz Progress and incorporate saved results immediately while retaining the current question and Answer Feedback until Next Question.

Reuse the existing shared progress calculation and save responses. No new persistence or provider boundary is required.

## Verification

Extend the existing rendered Flashcard and Quiz study tests with fake actions and deterministic fixtures. Check initial whole-collection percentages, rounding, Learned threshold crossings in both directions, unchanged percentages below the threshold, and continuation at 100%. For Quiz study, assert the update before Next Question and stability of the current answer presentation; after advancing, verify no duplicate progress change.

Hold a save pending, reject it, and retry successfully to verify progress reflects only confirmed results. Cover a saved translation-assisted incorrect answer and empty collection presentation. Use a local fixture or isolated environment for phone and desktop visual checks, then run the repository's standard checks. The PRD contains the full behavior and regression scope.

## References

- [Product requirements](../../prd/show-learned-percentage-during-study.md)
- [Implementation plan](../../../plans/show-learned-percentage-during-study.md)
- [Domain language](../../../CONTEXT.md)

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
