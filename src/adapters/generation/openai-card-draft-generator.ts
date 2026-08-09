import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { CardDraftGenerator } from "../../application/generation";

const cardDraftCollectionSchema = z.object({
  drafts: z
    .array(
      z.object({
        front: z.string().trim().min(1),
        back: z.string().trim().min(1),
      }),
    )
    .min(1),
});

const cardDraftCollectionFormat = zodTextFormat(
  cardDraftCollectionSchema,
  "card_draft_collection",
);

type StructuredResponseRequest = {
  model: string;
  input: Array<{
    role: "system" | "user";
    content: string;
  }>;
  text: { format: typeof cardDraftCollectionFormat };
};

type ParseStructuredResponse = (
  request: StructuredResponseRequest,
) => Promise<{ output_parsed: unknown }>;

export function createOpenAICardDraftGenerator({
  model,
  parse,
}: {
  model: string;
  parse: ParseStructuredResponse;
}): CardDraftGenerator {
  return {
    async generate({ sourceText, generationInstructions }) {
      const response = await parse({
        model,
        input: [
          { role: "system", content: generationInstructions },
          { role: "user", content: sourceText },
        ],
        text: { format: cardDraftCollectionFormat },
      });

      return cardDraftCollectionSchema.parse(response.output_parsed).drafts;
    },
  };
}
