# Plan: Announce learned milestones

Status: Both parts implemented and verified.

## Shared behavior

- Announce a successfully saved Recall Streak transition from two to three.
- Copy: “Answered correctly 3 times in a row. Now learned!”
- Do not announce on initial load, while saving, after a failed save, or for another correct answer at streak three.
- Preserve grading, learning progress, scheduling, and continued study of Learned items.
- A later streak reset followed by another transition from two to three qualifies as another milestone.

## Part 1: Flashcards

Show a toast after the third consecutive correct self-assessment is successfully recorded. Preserve automatic advancement; no Next Card step is added. Identify the subject as the flashcard just assessed so the toast cannot be mistaken for the next card's status.

Acceptance criteria:

- [x] The saved two-to-three transition shows a toast while the next card appears.
- [x] The toast communicates that the previous flashcard is now Learned.
- [x] Pending and failed saves do not show a milestone; retrying a successful attempt does not duplicate the notification.
- [x] Existing Learned cards do not trigger the toast merely by appearing or receiving another correct result.
- [x] The toast is announced accessibly without moving focus or obstructing study controls.
- [x] Verify the visible transition, non-milestone cases, and save failure/retry behavior, plus phone and desktop presentation.

Verification:

- `src/app/study/study-card.test.tsx`: 16 component tests passed, including milestone identification and automatic advancement, six-second expiry, manual dismissal, non-milestone results, pending/failed saves and retry, and learning again after a streak reset. Milestone, expiry, and dismissal tests each failed before their implementation.
- `bun run test`: 352 tests passed across 62 files.
- `bun run lint` and `bun run build`: passed.
- Chromium preview of the actual component with simulated saves and production CSS: checked at 320 × 568, 390 × 844, and 1280 × 900. Toast dismissal works, there is no horizontal overflow, and study controls remain reachable above the toast when scrolled into view. No live flashcard data was changed.
- The toast identifies the learned card by its Norwegian Front, expires after six seconds, and offers a dismiss button. Its live region is mounted before the announcement and does not receive focus.
- `cr review --agent`: completed with one minor test-fixture suggestion, rejected after inspection. Tests that submit repeatedly use only card-0; the two-card tests submit card-0 once and only reveal card-1. The dismissal test correctly checks the capped streak of three after learning, so using a higher streak would violate the domain rule. No review-driven changes were needed.

## Part 2: Quizzes

Show the milestone line beneath “Correct” in Answer Feedback after a successful third consecutive correct answer, keeping it visible until Next Question. This uses the existing pause after submission.

Acceptance criteria:

- [x] The saved two-to-three transition shows the milestone alongside Answer Feedback.
- [x] Next Question clears the message; another correct result at streak three does not show it again.
- [x] Pending, failed, incorrect, and Translation Help-assisted results do not announce a milestone.
- [x] Preserve the current question, translations, answer highlighting, and Next Question behavior.
- [x] Verify milestone and non-milestone feedback, save failure/retry behavior, and phone and desktop presentation.

Verification:

- Component tests in `src/app/quizzes/quiz-study.test.tsx` cover the milestone lifetime, non-milestone results, and pending/failed save with a successful multiple-answer retry. The new milestone test failed before implementation and passed afterward.
- `bun run test src/app/quizzes/quiz-study.test.tsx`: 22 tests passed.
- `bun run test`: 343 tests passed across 62 files.
- `bun run lint` and `bun run build`: passed.
- `cr review --agent`: completed with no findings in the two changed source/test files.
- Chromium preview of the actual component with a simulated successful save and production CSS: visually checked at 390 × 844 and 1280 × 900. The message sits beneath Correct, has no horizontal overflow, and clears on Next Question. No live quiz data was changed.
