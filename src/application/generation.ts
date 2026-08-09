export type GeneratedCardDraft = {
  front: string;
  back: string;
};

export const DEFAULT_GENERATION_TEMPLATE = `Select useful Norwegian words, phrases, and short sentences from the supplied Source Text for a Norwegian learner.

For every Card Draft:
- Front must contain only Norwegian selected from or lightly normalized from the Source Text.
- Back must contain only the corresponding English translation.
- Keep the Front understandable and useful when studied outside its original paragraph.
- Do not introduce unrelated vocabulary, claims, or facts.
- Return a focused collection without duplicate or near-duplicate selections.`;

export type SourceText = {
  id: string;
  content: string;
  generationStatus: "ready" | "completed" | "failed";
};

export type CardDraft = GeneratedCardDraft & {
  id: string;
  sourceTextId: string;
  reviewStatus: "pending" | "approved" | "rejected";
  approvedFlashcardId?: string | null;
};

export type SourceWithDrafts = SourceText & { drafts: CardDraft[] };

export interface GenerationRepository {
  createSource(content: string): Promise<SourceText>;
  claimFailedSource(sourceTextId: string): Promise<SourceText | undefined>;
  failGeneration(sourceTextId: string): Promise<SourceWithDrafts>;
  completeGeneration(
    sourceTextId: string,
    drafts: GeneratedCardDraft[],
  ): Promise<SourceWithDrafts>;
  getSourceWithDrafts(id: string): Promise<SourceWithDrafts | undefined>;
}

export interface CardDraftGenerator {
  generate(input: {
    sourceText: string;
    generationInstructions: string;
  }): Promise<GeneratedCardDraft[]>;
}

export type GenerationFailureCategory =
  | "provider_error"
  | "refusal"
  | "incomplete"
  | "timeout";

export class GenerationFailure extends Error {
  constructor(
    readonly category: GenerationFailureCategory,
    readonly diagnostic: Record<string, string | number | undefined> = {},
  ) {
    super("Card Draft generation failed.");
    this.name = "GenerationFailure";
  }
}

export class GenerationAttemptFailedError extends Error {
  constructor(
    readonly sourceTextId: string,
    readonly category: GenerationFailureCategory,
  ) {
    super("Card Drafts could not be generated. Try again.");
    this.name = "GenerationAttemptFailedError";
  }
}

export class SourceTextNotRetryableError extends Error {
  constructor() {
    super("Source Text is not available to retry.");
    this.name = "SourceTextNotRetryableError";
  }
}

export class SourceTextValidationError extends Error {
  constructor(
    readonly fieldErrors: { sourceText: string },
  ) {
    super("Source Text is invalid.");
    this.name = "SourceTextValidationError";
  }
}

type GenerationDependencies = {
  repository: GenerationRepository;
  generator: CardDraftGenerator;
  generationInstructions?: { get(): Promise<string> };
  logger?: {
    generationFailed(event: {
      sourceTextId: string;
      category: GenerationFailureCategory;
      diagnostic: Record<string, string | number | undefined>;
    }): void;
  };
  maximumSourceTextCharacters: number;
};

export function createGenerationService({
  repository,
  generator,
  generationInstructions,
  logger,
  maximumSourceTextCharacters,
}: GenerationDependencies) {
  async function attempt(source: SourceText) {
    const instructions = generationInstructions
      ? await generationInstructions.get()
      : DEFAULT_GENERATION_TEMPLATE;
    let drafts: GeneratedCardDraft[];
    try {
      drafts = await generator.generate({
        sourceText: source.content,
        generationInstructions: instructions,
      });
    } catch (error) {
      if (!(error instanceof GenerationFailure)) {
        throw error;
      }

      await repository.failGeneration(source.id);
      try {
        logger?.generationFailed({
          sourceTextId: source.id,
          category: error.category,
          diagnostic: error.diagnostic,
        });
      } catch {
        // Diagnostics must not replace the Learner's retryable failure state.
      }
      throw new GenerationAttemptFailedError(source.id, error.category);
    }

    return repository.completeGeneration(source.id, drafts);
  }

  return {
    async generate(sourceText: string) {
      if (!sourceText.trim()) {
        throw new SourceTextValidationError({
          sourceText: "Enter Norwegian Source Text.",
        });
      }

      if (sourceText.length > maximumSourceTextCharacters) {
        throw new SourceTextValidationError({
          sourceText: `Source Text must be ${maximumSourceTextCharacters.toLocaleString("en-US")} characters or fewer.`,
        });
      }

      const source = await repository.createSource(sourceText);
      return attempt(source);
    },
    async retry(id: string) {
      const source = await repository.claimFailedSource(id);
      if (!source) {
        throw new SourceTextNotRetryableError();
      }

      return attempt(source);
    },
    getSourceWithDrafts(id: string) {
      return repository.getSourceWithDrafts(id);
    },
  };
}
