---
title: Resolve Learned Milestone detection across study sessions
labels:
  - bug
status: open
---

# Resolve Learned Milestone detection across study sessions

## Summary

Flashcard and Quiz milestone detection compares the session's prior Recall Streak with the saved final streak. The persistence layer calculates the result against the current stored streak, which may have changed in another tab or device. These two versions of the prior streak can disagree, producing a duplicate or missing milestone announcement.

The domain context defines a milestone as the saved two-to-three transition and excludes another correct result at three. The earlier learned-percentage PRD explicitly excludes cross-tab synchronization, but the milestone plan does not state whether that limitation applies to milestone detection. Resolve this scope ambiguity and align implementation, tests, and documentation.

## Reproduction Scenarios to Verify

### Duplicate announcement

1. Open the same Flashcard or Quiz Question at Recall Streak two in two study sessions.
2. Answer correctly in session A, saving a two-to-three transition.
3. Answer correctly in session B, saving a three-to-three result.
4. Session B still holds a prior streak of two and therefore also announces the milestone.

### Missing announcement

1. Open the same item at Recall Streak one in two study sessions.
2. Answer correctly in session A, advancing the stored streak to two.
3. Answer correctly in session B, advancing the stored streak to three.
4. Session B still holds a prior streak of one and therefore omits the milestone.

These scenarios follow from static inspection of the component and persistence paths; the audit did not execute a multi-session reproduction.

## Expected Behavior and Scope Decision

Prefer determining the milestone from the authoritative saved transition: announce two-to-three exactly once for that attempt, and do not announce three-to-three. This does not inherently require live synchronization or polling of the study screen. If session-local detection is deliberately retained instead, explicitly document that limitation and reconcile the unqualified domain and plan statements.

## Acceptance Criteria

- [ ] Confirm and document whether Learned Milestones refer to the authoritative saved transition or a session-local approximation.
- [ ] Reproduce both stale-session scenarios for Flashcards and Quizzes through behavior-focused tests.
- [ ] If authoritative detection is chosen, correctly distinguish saved two-to-three and three-to-three transitions regardless of the client's initial streak.
- [ ] Preserve idempotent retry behavior, including a save that succeeds before its response is lost; retries do not create duplicate milestone announcements.
- [ ] Preserve pending/failed-save behavior, quiz feedback until Next Question, flashcard automatic advancement, and eligibility to learn again after a streak reset.
- [ ] Align CONTEXT.md and the milestone plan with the chosen contract, distinguishing milestone accuracy from live progress synchronization.

## References

- [Domain context](../../CONTEXT.md)
- [Milestone plan](../../plans/show-learned-milestone.md)
- [Learned-percentage PRD: session scope](../prd/show-learned-percentage-during-study.md)
- [Flashcard study component](../../src/app/study/study-card.tsx)
- [Quiz study component](../../src/app/quizzes/quiz-study.tsx)
- [Flashcard result persistence](../../src/adapters/persistence/postgres/study-repository.ts)
- [Quiz result persistence](../../src/adapters/persistence/postgres/quiz-study-repository.ts)
