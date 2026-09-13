---
title: Reset the Question form after Save and add another
labels:
  - bug
status: completed
---

# Reset the Question form after Save and add another

## Summary

Pressing Save and add another successfully saves the Question, but the form is not cleared and `NEXT_REDIRECT` appears below the image upload button.

## Steps to Reproduce

1. Open the form for adding a Question to a Quiz.
2. Fill in a valid Question.
3. Press Save and add another.
4. Observe the form and the area below the image upload button.

## Expected Behavior

The Question is saved, the form is reset to a clean state for the next Question, and no internal redirect message is displayed.

## Actual Behavior

The Question is saved, but the previous form values remain and `NEXT_REDIRECT` is shown below the image upload button.

## Acceptance Criteria

- [x] Save and add another saves the current Question exactly once.
- [x] After a successful save, all Question-specific fields and transient state are reset.
- [x] The Learner remains on a clean Question-entry form for the same Quiz.
- [x] `NEXT_REDIRECT` and other internal framework errors are not rendered in the interface.
- [x] Save failures show an actionable error without clearing entered data.
