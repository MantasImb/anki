---
status: accepted
---

# Use Google Cloud Translation behind a translation interface

Quiz Questions require retained English translations of their Norwegian prompts and Answer Options so Translation Help is immediate and does not depend on an external service during study. The application will use the Google Cloud Translation Advanced API during the New Question workflow, isolated behind a provider-neutral translation interface; Google client types, credentials, project configuration, and API errors remain inside its adapter.

The form sends the prompt and all Answer Options for translation before the Quiz Question is added. It presents the generated English as editable fields and persists the Learner's reviewed version with the Norwegian originals. Editing Norwegian text regenerates only the affected English content for review, while changes to the correct-answer selection, image, or English alone do not call the provider. If automatic translation fails, the form retains the entered content and permits a complete learner-authored English fallback.

## Considered Options

- Translating when the Learner requests Translation Help was rejected because it would add study-time latency, repeated cost, provider availability risk, and potentially changing translations.
- Calling the Google client directly from quiz workflows was rejected because provider concerns would spread into creation and study behavior.
- Requiring the Learner to translate every question manually was rejected because it would make creating a large Quiz unnecessarily laborious; manual English remains the failure fallback and correction path.

## Consequences

- A Quiz Question is added only after English exists for its prompt and every Answer Option.
- A Quiz Question edit is saved only after changed Norwegian text has matching reviewed English, without resetting learning progress.
- Translation Help reads retained content and never calls Google Cloud Translation during study.
- The Google credentials remain server-side and are supplied through protected deployment configuration.
- Translation behavior can be tested without Google by substituting the provider-neutral interface.
- Replacing Google later requires a new adapter rather than changes to quiz behavior or retained Question Translations.
