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
};

export type SourceWithDrafts = SourceText & { drafts: CardDraft[] };

export interface GenerationRepository {
  createSource(content: string): Promise<SourceText>;
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
  maximumSourceTextCharacters: number;
};

export function createGenerationService({
  repository,
  generator,
  maximumSourceTextCharacters,
}: GenerationDependencies) {
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
      const drafts = await generator.generate({
        sourceText,
        generationInstructions: DEFAULT_GENERATION_TEMPLATE,
      });
      return repository.completeGeneration(source.id, drafts);
    },
    getSourceWithDrafts(id: string) {
      return repository.getSourceWithDrafts(id);
    },
  };
}
