---
title: Prevent password manager prompts in quiz option fields
labels:
  - bug
status: open
---

# Prevent password manager prompts in quiz option fields

## Summary

When entering a Quiz Question, focusing the Option 1 or Option 2 field prompts 1Password to fill a password. Quiz Answer Options are ordinary text inputs and must not be treated as credential fields.

## Steps to Reproduce

1. Open the form for adding a Question to a Quiz.
2. Focus the Option 1 field.
3. Focus the Option 2 field.
4. Observe the 1Password autofill prompt.

## Expected Behavior

Password managers do not offer credential autofill for Quiz Answer Option fields.

## Actual Behavior

1Password prompts to fill passwords in Option 1 and Option 2.

## Acceptance Criteria

- [ ] Every Quiz Answer Option field is identified as a non-credential text input.
- [ ] Focusing Option 1, Option 2, or any additional option does not trigger a 1Password password-fill prompt.
- [ ] Normal text entry, browser autofill behavior, and accessibility remain intact.

