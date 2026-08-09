import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  GenerationFailure,
  type CardDraftGenerator,
} from "../../application/generation";

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
) => Promise<{
  output_parsed: unknown;
  status?: string;
  incomplete_details?: { reason?: string } | null;
  output?: Array<{
    type: string;
    content?: Array<{ type: string; refusal?: string }>;
  }>;
}>;

export function createOpenAICardDraftGenerator({
  model,
  parse,
}: {
  model: string;
  parse: ParseStructuredResponse;
}): CardDraftGenerator {
  return {
    async generate({ sourceText, generationInstructions }) {
      let response: Awaited<ReturnType<ParseStructuredResponse>>;
      try {
        response = await parse({
          model,
          input: [
            { role: "system", content: generationInstructions },
            { role: "user", content: sourceText },
          ],
          text: { format: cardDraftCollectionFormat },
        });
      } catch (error) {
        if (error instanceof Error && error.name === "APIConnectionTimeoutError") {
          throw new GenerationFailure("timeout", {
            provider: "openai",
            errorType: error.name,
          });
        }

        const providerError = error as {
          name?: string;
          status?: number;
          code?: string;
          request_id?: string;
        };
        throw new GenerationFailure("provider_error", {
          provider: "openai",
          errorType: providerError?.name,
          status: providerError?.status,
          code: providerError?.code,
          requestId: providerError?.request_id,
        });
      }

      if (response.status === "incomplete") {
        throw new GenerationFailure("incomplete", {
          provider: "openai",
          reason: response.incomplete_details?.reason,
          responseStatus: response.status,
        });
      }

      const refused = response.output?.some(
        (output) =>
          output.type === "message" &&
          output.content?.some((item) => item.type === "refusal"),
      );

      if (refused) {
        throw new GenerationFailure("refusal", {
          provider: "openai",
          responseStatus: response.status,
        });
      }

      const parsed = cardDraftCollectionSchema.safeParse(response.output_parsed);
      if (!parsed.success) {
        throw new GenerationFailure("incomplete", {
          provider: "openai",
          reason: "invalid_structured_output",
          responseStatus: response.status,
        });
      }

      return parsed.data.drafts;
    },
  };
}
