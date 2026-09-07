# Plan: Populate Quiz Answer Options from a pasted question

> Source PRD: [Populate Quiz Answer Options from a pasted question](../docs/prd/populate-quiz-answer-options-from-pasted-question.md)

## Architectural decisions

- Extend the shared editor on `/quizzes/{quizId}/questions/new` and `/quizzes/{quizId}/questions/{questionId}/edit`.
- Keep interpretation deterministic: plain clipboard text, at least three non-empty lines, first line as prompt and remaining lines as answers. Normalize common newline conventions and trim extracted edges; preserve duplicates and internal whitespace.
- Keep two boundaries: a pure interpreter and the shared form owning application, toast, and one transient Undo snapshot.
- Replace entirely empty answer placeholders; otherwise append while retaining existing answer identities, order, translations, and correctness. Pasted answers have empty English and start unchecked.
- Preserve cursor/selection insertion semantics. Undo restores the ordinary-paste prompt plus the prior English prompt and answer list. It clears its snapshot and returns focus to the prompt.
- Keep the toast available until Undo, a subsequent edit, translation, or save. A later matching paste replaces the snapshot. Focus and selection alone do not expire it.
- Clear old prompt English when auto-fill changes Norwegian. Invalidate translation review after auto-fill and Undo; retain existing review and manual fallback workflows.
- No schema, authentication, provider, image, or persistence changes. Existing Quiz scoping, Recall Streak preservation, translation service, and save navigation remain in use.
- Run deterministic interpreter and rendered form tests in each phase, with fake external actions. Complete a local browser check using an isolated form and no live services before release.

## Phase 1: Paste and undo in an empty form

**User stories**: 1–8, 11, 15–19, 30.

### What to build

Connect interpretation to a paste event in the Norwegian prompt. Populate a fresh form and offer a complete ordinary-paste recovery action in the toast.

### Acceptance criteria

- [x] The supplied example yields one prompt and exactly four unchecked answers.
- [x] Two or more answers, blank lines, Norwegian characters, duplicate answers, whitespace, and LF/CRLF/CR boundaries are covered by interpreter tests.
- [x] Typing and unmatched pastes stay ordinary; paste performs no network work.
- [x] Toast announces “Answers were auto-filled”; Undo restores full pasted text and original answers.

## Phase 2: Paste into a populated question

**User stories**: 9–10, 13–14, 20–21, 28–29.

### What to build

Apply paste and Undo throughout the shared create/edit editor, preserving existing content and insertion semantics.

### Acceptance criteria

- [x] Existing Norwegian or English answer text causes append, retaining mixed blank rows and stable existing identities.
- [x] Existing English and correctness survive; new answers remain unchecked.
- [x] Undo restores insertion and selection replacement results, prior answer order and translations, and prior English prompt.
- [x] Images remain independent; removing an unchecked answer from an unchecked set leaves the others unchecked.
- [x] Rendered tests exercise populated forms and verify submitted identities.

## Phase 3: Continue editing and paste again

**User stories**: 12, 22, 24–25.

### What to build

Finish the Undo lifecycle and accessible toast interaction while learners continue editing.

### Acceptance criteria

- [x] Both-language text edits, correctness changes, and option addition/removal/reordering expire Undo.
- [x] A second matching paste replaces the snapshot; Undo affects only that paste.
- [x] Focus and selection changes preserve Undo; keyboard activation returns focus to the prompt.
- [x] Toast fits a phone viewport with an accessible, practical Undo button and no automatic timeout.

## Phase 4: Translate, save, and recover from failures

**User stories**: 23, 26–28, 31.

### What to build

Complete translation/save integration and recovery verification, then validate the entire interaction in a local browser.

### Acceptance criteria

- [x] Translation and both save intents expire Undo before work begins, even if validation or requests fail.
- [x] Pending translation/save/upload allows only ordinary paste and creates no new snapshot or answers.
- [x] Existing translations and selected correctness survive translation preview, manual fallback, and failed saving.
- [x] Auto-fill and Undo cannot reuse a stale translation review marker.
- [x] Save submits the intended prompt, ordered options, identities, translations, correctness, and intent.
- [x] Existing workflow regression tests pass; local browser verification covers native paste, cursor/selection Undo, keyboard activation, and phone layout without production access.

## Verification results

- All four phases implemented in the shared Question form and deterministic interpreter.
- `npm test`: 61 files, 324 tests passed. Two subsequent edge-case tests were added; the final focused run of the form, interpreter, and submission workflow passed all 62 tests.
- `npm run lint`: passed.
- `tsc --noEmit`: 129 pre-existing diagnostics across 13 test files. A clean HEAD archive produces the same 129 diagnostics; comparison ignoring checkout paths and shifted line numbers finds no additions.
- Isolated local Chromium fixture: native clipboard paste; insertion and selection Undo; keyboard activation and restored focus; toast fitting a 390 × 844 viewport; translation preview and failed-save correctness preservation all passed. The fixture used fake actions, made no production requests, and was removed after verification.
- `cr review --agent`: completed with zero findings on the tracked form, form tests, and domain-context changes. The new interpreter was checked directly and covered by its unit tests.
- Integration testing found that React's automatic reset after a resolved action could clear checked answers after translation. A native reset listener now preserves the editable draft until successful navigation; component and browser tests verify this behavior.
