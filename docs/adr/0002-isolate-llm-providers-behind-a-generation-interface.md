---
status: accepted
---

# Isolate LLM providers behind a generation interface

The application will depend on a provider-neutral flashcard generation interface that accepts source text and generation instructions and returns structured card drafts. OpenAI is the first v1 provider, using Structured Outputs to return a strict collection of Norwegian fronts and English backs, but provider-specific SDK types and model identifiers will remain inside the OpenAI adapter.

## Considered Options

- Calling the OpenAI SDK directly from the generation workflow was rejected because provider details would spread into application behavior and make later replacement more expensive.
- Building a general multi-provider framework in v1 was rejected because a single narrow interface and one adapter provide the required seam with less code.

## Consequences

- Another LLM provider can be added by implementing the same generation interface.
- Provider errors and refusals must be translated into application-level generation failures.
- The exact OpenAI model is configuration rather than domain state.
- The OpenAI API key remains server-side in Vercel's protected environment variables.
