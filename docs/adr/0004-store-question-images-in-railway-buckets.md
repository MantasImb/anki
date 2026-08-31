---
status: accepted
---

# Store Question Images in Railway Buckets

Quiz Questions may contain one durable uploaded image, while the Next.js application runs on Vercel and its PostgreSQL database already runs on Railway. The application will store Question Images in a private, S3-compatible Railway Bucket and retain only the stable object key and image metadata in PostgreSQL.

The server will issue short-lived presigned URLs for direct browser uploads and reads. Railway bucket credentials remain in protected server configuration and are never sent to the browser. The upload policy accepts JPEG, PNG, WebP, and GIF, warns without blocking above 5 MB, and rejects files above 25 MB to bound storage abuse through the publicly reachable application.

## Considered Options

- Storing image bytes in PostgreSQL was rejected because large binary objects would expand database storage, backups, and query traffic without relational benefit.
- Using a mounted Railway Volume was rejected because the Vercel-hosted application cannot access a service-local filesystem directly and object storage better matches browser uploads and reads.
- Retaining external image URLs was rejected because third-party images can move or disappear and do not provide durable ownership.
- Proxying every image through a permanent Next.js route was rejected because it would route image traffic through Vercel unnecessarily; short-lived presigned read URLs preserve bucket privacy while allowing direct delivery.

## Consequences

- The browser uploads and reads objects directly from Railway using narrowly scoped, expiring URLs created by the server.
- Bucket CORS configuration must allow the application's deployment origins and required upload methods.
- The server validates file type and size before authorizing an upload; client-side checks provide immediate feedback but are not the security boundary.
- Replacing or removing a Question Image, deleting its Quiz Question, or deleting its Quiz makes the old object eligible for deletion.
- Object cleanup is best-effort. A bucket deletion failure does not roll back a successful question or quiz change, and orphaned objects must be retryable later.
