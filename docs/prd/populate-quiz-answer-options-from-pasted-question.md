# Populate Quiz Answer Options from a pasted question

## Problem Statement

As the Learner, I copy Norwegian multiple-choice questions together with their possible answers. Entering the prompt and every Answer Option separately makes adding Quiz Questions unnecessarily repetitive. I want to paste the entire block into the Norwegian prompt field and have the form separate it for me.

The same newline structure can also occur in an ordinary multiline question. Automatic detection therefore needs a direct recovery action that gives me the result of a normal paste. It must also preserve answers I have already entered, because I want to decide which options to remove myself.

## Solution

Recognize a paste containing at least three non-empty lines in the Norwegian prompt field. The first non-empty line supplies the prompt; every subsequent non-empty line supplies one Answer Option, in the pasted order. Ignore blank lines and support any number of options from two upward.

In an empty form, the Learner's example produces the prompt “Rett til å tilby drosjetjenester i et bestemt område kalles…” and four Answer Options: “Enerett”, “Reisebevis”, “Rutestyring”, and “Felleskapstillatelse”. Each option starts unchecked, ready for the Learner to mark correctness manually and obtain or enter English translations through the existing workflow.

When answer fields already contain text, append the pasted options after the existing options. Preserve existing content, translations, order, and correct-answer selections. The Learner removes unwanted options manually.

After filling, show a toast saying “Answers were auto-filled” with an Undo button. Undo reverses only the automatic interpretation: the Norwegian prompt becomes exactly what an ordinary paste would have produced at the original cursor position or selection, and the previous answer fields and English text are restored. Editing question or answer content, requesting translation, or saving dismisses the toast and ends that Undo opportunity.

## User Stories

1. As the Learner, I want to paste a question and its possible answers directly into the Norwegian prompt field, so that I can use the existing editor without a separate import screen.
2. As the Learner, I want the first non-empty pasted line to supply the question, so that the copied prompt is separated from its answers.
3. As the Learner, I want each following non-empty line to become an Answer Option, so that I do not have to copy answers individually.
4. As the Learner, I want two or more pasted answers supported, so that the feature works beyond the four-answer example.
5. As the Learner, I want blank lines ignored during detection, so that incidental spacing does not create empty answers.
6. As the Learner, I want text copied with common newline conventions to work, so that the source application or device does not determine whether filling succeeds.
7. As the Learner, I want Norwegian characters, punctuation, and answer order preserved, so that the copied learning material keeps its meaning.
8. As the Learner, I want a fresh form to contain only the extracted answers, so that its initial empty placeholders do not become extra options to remove.
9. As the Learner, I want new answers appended when existing answers contain text, so that pasting does not replace my work.
10. As the Learner, I want existing answer translations and correctness selections preserved when answers are appended, so that unrelated content remains usable.
11. As the Learner, I want newly pasted options to start unchecked, so that answer position is never treated as evidence of correctness.
12. As the Learner, I want to mark one or several correct options manually, so that both Single-Choice Questions and Multiple-Choice Questions remain supported.
13. As the Learner, I want to remove unwanted pasted or existing options manually, so that I control the final answer set.
14. As the Learner, I want deleting an unchecked pasted option to leave other unchecked options unchecked, so that removing unwanted answers does not silently choose a correct answer for me.
15. As the Learner, I want ordinary text and non-matching pastes to retain normal input behavior, so that the question field remains useful for free-form questions.
16. As the Learner, I want typing line breaks to remain ordinary editing, so that automatic splitting happens only when I paste.
17. As the Learner, I want a toast confirming that answers were auto-filled, so that I understand why the form changed.
18. As the Learner, I want an Undo button in that toast, so that I can recover immediately when a multiline question was mistaken for a question with answers.
19. As the Learner, I want Undo to retain the full pasted text in the question field, so that I do not need to paste again after rejecting the automatic split.
20. As the Learner, I want Undo to respect the original insertion point or selected text, so that its result matches an ordinary paste into an existing question.
21. As the Learner, I want Undo to restore the previous answers, translations, order, and correct-answer selections, so that a rejected automatic fill does not alter unrelated content.
22. As the Learner, I want Undo to stop being available when I edit question or answer fields, so that it cannot discard newer work.
23. As the Learner, I want translation and save attempts to end the Undo opportunity, so that a previous paste cannot restore an obsolete form state.
24. As the Learner, I want a second recognized paste to offer Undo for that latest fill, so that repeated pastes remain predictable.
25. As the Learner, I want the toast and Undo usable by keyboard and on a phone, so that recovery is available wherever I enter questions.
26. As the Learner, I want pasted options to participate in the existing translation review and manual English fallback, so that saving still requires complete learning material.
27. As the Learner, I want translation or save failures to preserve the populated form, so that a failed request does not require me to paste again.
28. As the Learner, I want pasting and Undo to leave the Question Image intact, so that entering text does not affect an independently selected image.
29. As the Learner, I want the same paste assistance when adding or editing a Quiz Question, so that the shared editor behaves consistently.
30. As the Learner, I want detection to happen immediately during my paste without an external request or additional clipboard permission prompt, so that adding questions remains quick.
31. As the Learner, I want to review and save the result explicitly, so that pasting alone does not persist a question or change learning progress.

## Implementation Decisions

- **Paste interpretation module:** introduce a small, deterministic interface that accepts clipboard plain text and returns either no match or an extracted Norwegian prompt and ordered option texts. It owns newline normalization, surrounding-whitespace trimming, removal of empty lines, and the minimum of one prompt plus two answers. It has no browser, form-state, persistence, translation, or network dependency.
- **Question form module:** extend the existing shared question editor to invoke the interpreter on paste into the Norwegian prompt field, apply the result, and own the toast and one-step Undo lifecycle. Keep this behavior within the form rather than introducing a global notification service or generic undo framework.
- Interpret clipboard text, not all text already present in the question field. Restrict automatic detection to paste events in that field; typing, English-field pastes, and answer-field pastes remain ordinary editing.
- Normalize LF, CRLF, and CR line boundaries for interpretation. Trim extracted lines at their edges while preserving internal whitespace, Norwegian characters, punctuation, duplicate answer text, and authored order. Do not infer option labels, correct answers, language, or question boundaries from content.
- Preserve the ordinary-paste result separately from normalized extracted content. It must include the original surrounding prompt text and the full pasted text, with the same textarea newline behavior a normal paste would have produced.
- With no answer text entered, use the extracted options in place of the empty placeholders. If any existing option contains Norwegian or English text, preserve the entire existing option list and append new options. Blank rows mixed with populated rows remain available for manual removal.
- Preserve stable identities and all content of existing options. Assign new form identities to pasted options; do not copy an existing option's identity or correctness into them.
- New options have Norwegian text, empty English text, and no correctness selection. The current form's default first-correct placeholder must not leak into automatic filling. Removing an unchecked option from a set with no correct selections must leave that set unselected. This feature does not require changing the initial defaults of an untouched manual form.
- The toast copy is “Answers were auto-filled” and its action is “Undo”. Announce the status accessibly without moving focus away from the question field; the Undo button must be keyboard reachable and practical on narrow screens.
- A recognized paste starts one Undo opportunity containing the previous answer state and English prompt, plus the prompt result of an ordinary paste. Undo restores those values, returns editing focus to the prompt, and closes the toast. Restoration must not trigger interpretation again.
- Editing either prompt language, either answer language, or a correctness selection ends the Undo opportunity. Adding, removing, or reordering options also ends it. Moving focus, moving the cursor, or selecting text alone does not end it.
- Requesting translation or either save action ends the Undo opportunity before asynchronous work begins, including when validation, translation, upload, or saving later fails. Failure does not resurrect an expired Undo snapshot.
- A subsequent recognized paste creates a new snapshot from the current form and replaces the previous toast. Undo affects only that latest fill. A non-matching paste follows ordinary editing behavior and expires any previous Undo opportunity when it changes question content.
- Pasting and Undo do not request translation, upload an image, call a save action, or change retained data. The resulting fields flow through the existing correctness validation, English translation review, fallback, and save contracts.
- Existing answer translations remain associated with their existing options when new options are appended. Translation-review state must follow the resulting Norwegian content; changing or restoring the prompt must not allow a review marker for different text to bypass the existing review rules.
- Keep the selected or existing Question Image and its removal state independent of automatic filling and Undo.
- No schema, repository contract, provider API, route, authentication, or collection-ownership changes are required. Editing a saved question continues to preserve its Recall Streak, and saving remains scoped to its selected Quiz.

## Testing Decisions

- The Learner confirmed the two-module breakdown and explicit tests for both. Tests should assert observable input/output contracts, rendered behavior, and submitted form content rather than private state, component structure, generated identifiers, or helper calls.
- Unit-test Paste interpretation with the supplied four-answer example, the two-answer minimum, more than four answers, blank and whitespace-only lines, LF/CRLF/CR input, surrounding whitespace, Norwegian characters, punctuation, duplicate options, empty clipboard text, and inputs with fewer than three non-empty lines. Assert exact extracted text and order or no match.
- Follow the existing deterministic Vitest unit-test style. The interpreter tests need neither a browser nor external services.
- Extend the existing question-form component tests, which already use Testing Library and user-event in jsdom with fake form actions. Exercise real paste interactions through the rendered Norwegian prompt field rather than invoking component internals.
- Verify that a fresh form produces exactly the extracted option count with no selected correct options. Cover the append case with Norwegian content, English-only content, and mixed blank and populated rows. Verify that existing translations, order, and correctness survive and that submitted existing option identities remain intact.
- Verify manual correctness selection after a paste, removal of unwanted unchecked options without selecting an answer automatically, and continued operation of the existing option controls.
- Verify the toast text, accessible Undo button, and restoration in an empty prompt, at an insertion point within existing text, and over a selected range. Assert the ordinary-paste text, restored answer list and English text, unchanged image state, and absence of a second automatic split after Undo.
- Verify toast dismissal and Undo expiry after both-language text edits, correctness changes, option addition/removal/reordering, translation requests, and both save actions. Cover validation or request failure after expiry and repeated pastes with Undo affecting only the latest fill.
- Verify that focus or selection changes alone leave Undo usable. Verify that non-matching input, unavailable clipboard plain text, and typed multiline text retain ordinary editing behavior without populating answers.
- Exercise translation review and save submission with fake actions, checking the final prompt, option order, translations, correctness, and save intent. Existing workflow tests for ordered translation, reviewed English, validation, failure preservation, and collection-scoped saving provide prior art and regression coverage; new provider or database tests are unnecessary unless implementation changes those boundaries.
- Include a focused browser check of native paste and Undo at a cursor and selection, plus keyboard access and a phone-sized toast layout. This check should use an isolated local question form or test fixture; normal automated verification must not call live translation, image storage, or production persistence services.

## Out of Scope

- Importing multiple Quiz Questions in one paste, bulk import screens, files, exports, or shared question banks.
- AI parsing, OCR, correct-answer inference, bullet or numbering removal, wrapped-answer reconstruction, or semantic detection of multiline questions.
- Replacing populated answers, deduplicating answers, or automatically removing unwanted content.
- Automatic translation or saving triggered by paste.
- A persistent undo history, multi-step undo/redo, overriding browser keyboard undo, or undoing saved content.
- Flashcard paste assistance, study behavior, progress changes, image processing, or new language settings.
- New external services, storage formats, authentication work, or a separate toast framework.

## Further Notes

- **Conversation facts:** the Learner accepted the first-non-empty-line convention with two or more subsequent answers, manual correctness, appending when answers already contain text, ordinary-paste restoration, and a toast with Undo that expires on later edits, translation, or save. The Learner also confirmed the module and testing breakdown.
- **Repository facts:** the shared editor starts with two empty options and initially marks the first correct. It supports adding, removing, and reordering options; its removal behavior currently selects the first remaining option if none is correct. It already has translation review, manual English fallback, image handling, and two creation save intents. These behaviors explain the required integration and regression checks.
- **Explicit assumption — populated prompt:** during a detected paste into existing prompt text, insert the extracted first line at the original cursor or selection, preserving surrounding text. Undo replaces that interpretation with the corresponding full ordinary paste. In an empty field or a full-field selection, the extracted first line becomes the whole prompt.
- **Explicit assumption — prompt English:** when automatic filling changes the Norwegian prompt, clear its old English translation for review while preserving existing answer translations. Undo restores the previous English prompt as ordinary paste would; the existing rules for reviewing changed Norwegian still apply.
- **Explicit assumption — toast lifetime:** keep the toast available without an automatic timeout until Undo is used or an action ends its applicability. Only the latest fill has an Undo opportunity, and a fresh form after successful navigation retains neither a toast nor a snapshot.
- **Explicit assumption — pending requests:** do not begin a new automatic fill while translation, save, or image upload is pending. Fall back to the form's ordinary paste behavior without creating new options or an Undo snapshot, so an in-flight response cannot leave a newly created recovery action referring to stale form state.
- **Accepted limitation:** an ordinary multiline question can satisfy the same line-count rule as a question with answers. Undo is the agreed recovery mechanism; semantic classification is deliberately unnecessary.
- The feature is complete when both modules satisfy their behavior tests and the local browser check confirms ordinary-paste recovery and a usable toast. This is a form interaction change that does not require a new architectural decision or data migration.
