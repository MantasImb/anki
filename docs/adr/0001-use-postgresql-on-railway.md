---
status: accepted
---

# Use PostgreSQL on Railway for durable application state

The Next.js application will run on Vercel and use PostgreSQL hosted on Railway as the source of truth for source texts, card drafts, flashcards, and study results. The sole learner needs the same durable data when accessing the application remotely from a phone, and PostgreSQL provides transactions and constraints for keeping related learning state consistent.

## Considered Options

- Browser-only storage was rejected because it would isolate progress to one device.
- Redis was rejected as the primary store because its scheduling-friendly data structures do not outweigh the additional persistence and operational choices for this application.

## Consequences

- Application code will access stored data through a small persistence boundary so storage details do not leak into learning behavior.
- The PostgreSQL adapter will use Drizzle ORM for typed queries and Drizzle Kit for versioned schema migrations; Drizzle types will not cross the persistence boundary.
- Database schema changes require migrations and operational backups.
- Vercel must connect to PostgreSQL through Railway's public TCP proxy because Vercel is outside Railway's private network.
- The Railway public database connection string must be kept in Vercel's protected environment variables.
- Vercel assigns the application a generated `vercel.app` URL that is public by default. Access protection is explicitly deferred for the single-learner v1.
