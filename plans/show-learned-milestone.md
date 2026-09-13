# Plan: Announce learned milestones

Status: Design agreed for both parts; implementation not started.

## Shared behavior

- Announce a successfully saved Recall Streak transition from two to three.
- Copy: “Answered correctly 3 times in a row. Now learned!”
- Do not announce on initial load, while saving, after a failed save, or for another correct answer at streak three.
- Preserve grading, learning progress, scheduling, and continued study of Learned items.
- A later streak reset followed by another transition from two to three qualifies as another milestone.

## Part 1: Flashcards

Show a toast after the third consecutive correct self-assessment is successfully recorded. Preserve automatic advancement; no Next Card step is added. Identify the subject as the flashcard just assessed so the toast cannot be mistaken for the next card's status.

Acceptance criteria:

- [ ] The saved two-to-three transition shows a toast while the next card appears.
- [ ] The toast communicates that the previous flashcard is now Learned.
- [ ] Pending and failed saves do not show a milestone; retrying a successful attempt does not duplicate the notification.
- [ ] Existing Learned cards do not trigger the toast merely by appearing or receiving another correct result.
- [ ] The toast is announced accessibly without moving focus or obstructing study controls.
- [ ] Verify the visible transition, non-milestone cases, and save failure/retry behavior, plus phone and desktop presentation.

## Part 2: Quizzes

Show the milestone line beneath “Correct” in Answer Feedback after a successful third consecutive correct answer, keeping it visible until Next Question. This uses the existing pause after submission.

Acceptance criteria:

- [ ] The saved two-to-three transition shows the milestone alongside Answer Feedback.
- [ ] Next Question clears the message; another correct result at streak three does not show it again.
- [ ] Pending, failed, incorrect, and Translation Help-assisted results do not announce a milestone.
- [ ] Preserve the current question, translations, answer highlighting, and Next Question behavior.
- [ ] Verify milestone and non-milestone feedback, save failure/retry behavior, and phone and desktop presentation.
