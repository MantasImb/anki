import { describe, expect, it, vi } from "vitest";
import { createOpenAICardDraftGenerator } from "./openai-card-draft-generator";

describe("OpenAI Card Draft generator", () => {
  it("normalizes a structured-output refusal", async () => {
    const generator = createOpenAICardDraftGenerator({
      model: "configured-model",
      parse: vi.fn().mockResolvedValue({
        status: "completed",
        output_parsed: null,
        output: [
          {
            type: "message",
            content: [{ type: "refusal", refusal: "Cannot comply." }],
          },
        ],
      }),
    });

    await expect(
      generator.generate({
        sourceText: "Source Text",
        generationInstructions: "Generation Instructions",
      }),
    ).rejects.toMatchObject({ category: "refusal" });
  });

  it("normalizes an incomplete structured response", async () => {
    const generator = createOpenAICardDraftGenerator({
      model: "configured-model",
      parse: vi.fn().mockResolvedValue({
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        output_parsed: null,
        output: [],
      }),
    });

    await expect(
      generator.generate({
        sourceText: "Source Text",
        generationInstructions: "Generation Instructions",
      }),
    ).rejects.toMatchObject({
      category: "incomplete",
      diagnostic: { reason: "max_output_tokens" },
    });
  });

  it("normalizes a completed response without a valid complete collection", async () => {
    const generator = createOpenAICardDraftGenerator({
      model: "configured-model",
      parse: vi.fn().mockResolvedValue({
        status: "completed",
        output_parsed: { drafts: [] },
        output: [],
      }),
    });

    await expect(
      generator.generate({
        sourceText: "Source Text",
        generationInstructions: "Generation Instructions",
      }),
    ).rejects.toMatchObject({
      category: "incomplete",
      diagnostic: { reason: "invalid_structured_output" },
    });
  });

  it("normalizes an OpenAI request timeout", async () => {
    const timeout = new Error("Request timed out");
    timeout.name = "APIConnectionTimeoutError";
    const generator = createOpenAICardDraftGenerator({
      model: "configured-model",
      parse: vi.fn().mockRejectedValue(timeout),
    });

    await expect(
      generator.generate({
        sourceText: "Source Text",
        generationInstructions: "Generation Instructions",
      }),
    ).rejects.toMatchObject({ category: "timeout" });
  });

  it("normalizes other provider errors without exposing their message", async () => {
    const providerError = Object.assign(new Error("sensitive provider detail"), {
      name: "APIError",
      status: 429,
      code: "rate_limit_exceeded",
      request_id: "request-123",
    });
    const generator = createOpenAICardDraftGenerator({
      model: "configured-model",
      parse: vi.fn().mockRejectedValue(providerError),
    });

    await expect(
      generator.generate({
        sourceText: "Source Text",
        generationInstructions: "Generation Instructions",
      }),
    ).rejects.toMatchObject({
      category: "provider_error",
      message: "Card Draft generation failed.",
      diagnostic: {
        status: 429,
        code: "rate_limit_exceeded",
        requestId: "request-123",
      },
    });
  });

  it("returns strict structured Front and Back pairs through the provider-neutral contract", async () => {
    const parse = vi.fn().mockResolvedValue({
      output_parsed: {
        drafts: [
          { front: "høflig", back: "polite" },
          { front: "en drosjesjåfør", back: "a taxi driver" },
        ],
      },
    });
    const generator = createOpenAICardDraftGenerator({
      model: "configured-model",
      parse,
    });

    const drafts = await generator.generate({
      sourceText: "Drosjesjåføren skal opptre høflig.",
      generationInstructions: "Select useful, source-grounded material.",
    });

    expect(drafts).toEqual([
      { front: "høflig", back: "polite" },
      { front: "en drosjesjåfør", back: "a taxi driver" },
    ]);
    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "configured-model",
        input: [
          {
            role: "system",
            content: "Select useful, source-grounded material.",
          },
          {
            role: "user",
            content: "Drosjesjåføren skal opptre høflig.",
          },
        ],
        text: {
          format: expect.objectContaining({
            name: "card_draft_collection",
            strict: true,
            type: "json_schema",
          }),
        },
      }),
    );
  });
});
