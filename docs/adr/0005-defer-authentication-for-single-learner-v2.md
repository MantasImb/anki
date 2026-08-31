---
status: accepted
---

# Defer authentication for the single-Learner v2

V2 remains a personal application for one implicit Learner and will not add authentication, accounts, authorization checks, or per-Learner data ownership. The generated deployment URL remains publicly reachable even though v2 adds Flashcard Deck and Quiz management, destructive collection actions, Google-backed translation, and presigned Question Image uploads.

This is an explicit scope decision rather than a security guarantee. Authentication is expected later, at which point a new ADR should supersede this decision.

## Considered Options

- Building an account system in v2 was rejected because multi-Learner identity, sessions, recovery, and ownership would substantially expand the release beyond the learning workflows.
- Adding a temporary shared-password or deployment-protection mechanism was deferred with the broader authentication work to avoid maintaining an interim access model.

## Consequences

- Anyone who obtains the application URL can read, create, edit, and delete learning content and progress.
- Anyone who obtains the URL can request presigned Question Image uploads. Private bucket credentials remain server-side, but that does not establish Learner identity.
- The 25 MB per-image safety limit bounds individual uploads but does not prevent repeated upload or storage abuse.
- V2 must not store material whose exposure through the public URL would be unacceptable.
- Persistence interfaces and schema remain single-Learner and contain no ownership partitioning.
- Future authentication work must protect existing read and mutation paths, translation requests, and presigned upload issuance.
