---
title: Show the Question count when a Quiz is open
labels:
  - enhancement
status: completed
---

# Show the Question count when a Quiz is open

## Summary

Add a statistic beside Quiz Progress in the open Quiz view so the Learner can immediately see how many Questions have been added to that Quiz.

## Acceptance Criteria

- [x] The current Question count is visible beside Quiz Progress in the open Quiz view.
- [x] Non-empty Quizzes present both statistics in one metadata row using the format `Quiz Progress: 25% Learned · 4 questions`, wrapping naturally on narrow screens.
- [x] The count reflects the total number of Questions currently saved in the Quiz.
- [x] The count updates after Questions are added or removed without requiring unrelated navigation.
- [x] The label handles singular and plural values clearly, such as `1 question` and `2 questions`.
- [x] An empty Quiz hides both Quiz Progress and the Question count and continues to display the existing empty state.
