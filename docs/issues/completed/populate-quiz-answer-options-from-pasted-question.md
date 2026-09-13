---
title: Populate Quiz Answer Options from a pasted question
labels:
  - ready-for-agent
prd: ../../prd/populate-quiz-answer-options-from-pasted-question.md
status: completed
---

# Populate Quiz Answer Options from a pasted question

## Summary

Implement the [product requirements](../../prd/populate-quiz-answer-options-from-pasted-question.md). Pasting a Norwegian question followed by newline-separated answers into the Norwegian prompt field automatically separates the question and its Answer Options. The Learner marks correct answers manually. Existing answers are preserved, and a toast offers Undo to restore the behavior of an ordinary paste when detection is wrong.

## Example

```text
Rett til å tilby drosjetjenester i et bestemt område kalles…
Enerett
Reisebevis
Rutestyring
Felleskapstillatelse
```

In an empty form, the first line becomes the Norwegian prompt and the next four lines fill four Answer Options in the supplied order. None of the pasted options is marked correct.

If two answers already contain text, the four pasted answers are added after them. The existing answers retain their text, translations, order, and correct-answer selections. The Learner can remove unwanted answers manually.

## Acceptance Criteria

- [x] Pasting into the Norwegian prompt field detects clipboard text containing at least three non-empty lines: one prompt and at least two Answer Options.
- [x] The first non-empty line supplies the prompt; each subsequent non-empty line supplies one Answer Option in the pasted order. Blank lines are ignored for detection and splitting.
- [x] Detection accepts any number of answers from two upward, rather than requiring exactly four.
- [x] In an empty form, extracted options replace empty placeholders so the supplied example produces exactly four options. If any existing option contains Norwegian or English text, preserve the existing list and append new options.
- [x] With existing populated answers, pasted answers are appended without overwriting existing answers, translations, or correct-answer selections.
- [x] New pasted answers start with empty English translations and no correct-answer selections. The existing manual correctness and translation workflow remains available.
- [x] Removing an unchecked option while no answers are marked correct does not automatically select another answer.
- [x] After an automatic split, a toast says “Answers were auto-filled” and contains an Undo button.
- [x] Editing the question or Answer Options, including their translations or correct-answer selections, dismisses the toast and clears its Undo opportunity. Adding, removing, or reordering options also ends that opportunity.
- [x] Requesting translation or saving dismisses the toast and clears its Undo opportunity, so Undo cannot discard later work or act on saved content.
- [x] Undo leaves the Norwegian prompt exactly as an ordinary paste would: inserted at the original cursor position or replacing the original selection, preserving pasted line breaks and surrounding prompt text.
- [x] Undo restores the previous Answer Options, their order, translations, and correct-answer selections, together with the previous English prompt text. It does not split the restored prompt again.
- [x] Clipboard text that does not match the format follows ordinary paste behavior. Typing newlines does not trigger automatic splitting.
- [x] Pasting only fills the form; the Learner continues to review, translate, mark correctness, and save through the existing workflow.
- [x] Explicit interpreter unit tests and rendered question-form tests cover the behaviors described in the PRD, including submission and failure regressions through fake actions.
- [x] A focused local browser check verifies ordinary paste recovery, keyboard access to Undo, and toast usability on a phone-sized viewport.

## Module Breakdown

The Learner confirmed this breakdown and explicit tests for both modules:

1. Paste interpretation: a deterministic clipboard-text interface that recognizes the format and extracts the prompt and ordered answers.
2. Question form: paste integration, placeholder replacement or append behavior, preservation of existing content, the confirmation toast, Undo snapshots, and their expiry.

The PRD records the implementation defaults for existing prompt text, English prompt clearing, toast lifetime, and pending requests. No new persistence or provider boundary is required.

## Verification

Exercise the rendered form with the supplied example, the two-answer minimum, blank lines, common newline conventions, and non-matching clipboard text. Verify append behavior with populated answers and existing correctness selections. Verify the toast and Undo in an empty prompt, at a cursor within existing text, and over a selected range; check that previous answer content and translations are restored and the pasted text is not automatically split again. Verify that text edits, correctness changes, option additions/removals/reordering, translation requests, and save attempts dismiss the toast and make its Undo unavailable. Check that a second detected paste offers Undo only for that latest fill. Confirm that manually marking correctness, translating, and saving still operate on the resulting options.

Use deterministic unit tests for interpretation and the existing question-form component-test style for integration. Cover the detailed cases in the PRD through fake actions and complete a local browser check without calling production services.

## References

- [Product requirements](../../prd/populate-quiz-answer-options-from-pasted-question.md)
- [Domain language](../../../CONTEXT.md)
- [Implementation plan and verification](../../../plans/populate-quiz-answer-options-from-pasted-question.md)
