import { describe, expect, it, vi } from "vitest";
import { createOpenAICardDraftGenerator } from "./openai-card-draft-generator";

describe("OpenAI Card Draft generator", () => {
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
