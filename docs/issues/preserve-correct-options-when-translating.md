---
title: Preserve correct-option selection when translating Quiz options
labels:
  - bug
status: open
---

# Preserve correct-option selection when translating Quiz options

## Summary

Using Translate after filling in the Norwegian Answer Options resets the selected boxes that identify the correct option or options.

## Steps to Reproduce

1. Open the form for adding a Question to a Quiz.
2. Fill in the Norwegian Answer Options.
3. Select the box or boxes that mark the correct option or options.
4. Press Translate.
5. Observe that the correct-option selection is reset.

## Expected Behavior

Translating Question or Answer Option text preserves which Answer Options are marked correct.

## Actual Behavior

The selected correct-option boxes are cleared or reset after translation.

## Acceptance Criteria

- [ ] Translate updates translated content without changing which Answer Options are marked correct.
- [ ] The selection is preserved for both single-answer and multiple-answer Questions.
- [ ] Existing translation behavior continues to work.

