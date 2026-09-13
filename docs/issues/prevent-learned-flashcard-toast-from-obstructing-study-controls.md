---
title: Prevent the learned Flashcard toast from obstructing study controls
labels:
  - bug
status: open
---

# Prevent the learned Flashcard toast from obstructing study controls

## Summary

The Learned Milestone toast can overlap the next Flashcard's assessment buttons on a small phone. The implementation adds bottom padding so the Learner can scroll the controls clear, but the agreed requirement is that the toast does not obstruct study controls.

## Steps to Reproduce

1. Use a 320 × 568 viewport and a Deck with at least two Flashcards.
2. Start with a Flashcard at Recall Streak two, reveal its Back, and mark it Correct.
3. While the milestone toast is visible, reveal the automatically selected next Flashcard's Back.
4. Observe the assessment buttons before scrolling them clear of the toast.

## Expected Behavior

The toast identifies the Flashcard just learned without covering the active card's study controls. Automatic advancement and ordinary study interactions remain available.

## Actual Behavior and Evidence

A local Chromium preview of the actual StudySession component with simulated saves and production CSS reproduced the overlap at 320 × 568 with scroll position zero. The toast occupied vertical coordinates 454–552, Incorrect occupied 482–538, and Correct occupied 550–606. The next card used “Jeg lærer norsk hver dag.” and “I learn Norwegian every day.”

The earlier visual verification scrolled to the bottom before checking overlap. It established reachability after scrolling, rather than the stronger no-obstruction criterion checked off in the milestone plan.

## Acceptance Criteria

- [ ] The toast does not cover Reveal English Back, Correct, or Incorrect at small-phone, phone, and desktop viewport sizes, including before corrective scrolling.
- [ ] Verify short and long Front/Back content and revealing the next card while the toast is visible.
- [ ] Preserve milestone-only triggering, automatic advancement, card identification, accessible announcement, manual dismissal, and six-second expiry.
- [ ] Add a regression check that detects the reproduced overlap without first scrolling the controls clear.
- [ ] Update the milestone plan's verification record to accurately describe the corrected checks.

## References

- [Milestone plan](../../plans/show-learned-milestone.md)
- [Domain context](../../CONTEXT.md)
- [Flashcard study component](../../src/app/study/study-card.tsx)
- [Flashcard component tests](../../src/app/study/study-card.test.tsx)
