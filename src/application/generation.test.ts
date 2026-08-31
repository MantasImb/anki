import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GENERATION_TEMPLATE,
  GenerationFailure,
  createGenerationService,
  type GenerationFailureCategory,
} from "./generation";

describe("Source Text generation", () => {
  it("retains the selected Deck through generation", async () => {
    const createSource = vi.fn(
      async (deckId: string, content: string) => {
        return {
          id: "source-1",
          deckId,
          content,
          generationStatus: "ready" as const,
        };
      },
    );
    const completeGeneration = vi.fn(async (
      _deckId: string,
      sourceTextId: string,
      _drafts: unknown[],
    ) => {
      void _drafts;
      return {
        id: sourceTextId,
        deckId: "deck-a",
        content: "Drosjesjåføren skal opptre høflig.",
        generationStatus: "completed" as const,
        drafts: [],
      };
    });
    const repository = {
      createSource,
      claimFailedSource: vi.fn(),
      failGeneration: vi.fn(),
      completeGeneration,
      getSourceWithDrafts: vi.fn(),
    };
    const generation = createGenerationService({
      repository,
      generator: { generate: vi.fn().mockResolvedValue([]) },
      maximumSourceTextCharacters: 20_000,
    });

    await expect(
      generation.generate(
        "deck-a",
        "Drosjesjåføren skal opptre høflig.",
      ),
    ).resolves.toMatchObject({ deckId: "deck-a" });
    expect(createSource).toHaveBeenCalledWith(
      "deck-a",
      "Drosjesjåføren skal opptre høflig.",
    );
    expect(completeGeneration).toHaveBeenCalledWith(
      "deck-a",
      "source-1",
      [],
    );
  });

  it("keeps a generation failure retryable when diagnostic logging fails", async () => {
    const source = {
      id: "source-1",
      deckId: "deck-a",
      content: "Drosjesjåføren skal opptre høflig.",
      generationStatus: "ready" as const,
    };
    const generation = createGenerationService({
      repository: {
        async createSource() {
          return source;
        },
        claimFailedSource: vi.fn(),
        async failGeneration() {
          return { ...source, generationStatus: "failed" as const, drafts: [] };
        },
        completeGeneration: vi.fn(),
        getSourceWithDrafts: vi.fn(),
      },
      generator: {
        async generate() {
          throw new GenerationFailure("timeout");
        },
      },
      logger: {
        generationFailed() {
          throw new Error("logging unavailable");
        },
      },
      maximumSourceTextCharacters: 20_000,
    });

    await expect(generation.generate("deck-a", source.content)).rejects.toMatchObject({
      sourceTextId: "source-1",
      category: "timeout",
    });
  });

  it("allows only one caller to claim a failed Source Text for retry", async () => {
    const failedSource = {
      id: "source-1",
      deckId: "deck-a",
      content: "Drosjesjåføren skal opptre høflig.",
      generationStatus: "failed" as const,
      drafts: [],
    };
    const generator = { generate: vi.fn().mockResolvedValue([]) };
    const generation = createGenerationService({
      repository: {
        createSource: vi.fn(),
        async claimFailedSource() {
          return undefined;
        },
        failGeneration: vi.fn(),
        completeGeneration: vi.fn(),
        async getSourceWithDrafts() {
          return failedSource;
        },
      },
      generator,
      maximumSourceTextCharacters: 20_000,
    });

    await expect(generation.retry("deck-a", "source-1")).rejects.toThrow(
      "Source Text is not available to retry.",
    );
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it("retries a retained failed Source Text into one complete collection", async () => {
    const failedSource = {
      id: "source-1",
      deckId: "deck-a",
      content: "Drosjesjåføren skal opptre høflig.",
      generationStatus: "failed" as const,
      drafts: [],
    };
    const generation = createGenerationService({
      repository: {
        async createSource() {
          throw new Error("retry must not create another Source Text");
        },
        async failGeneration() {
          return failedSource;
        },
        async claimFailedSource() {
          return { ...failedSource, generationStatus: "ready" as const };
        },
        async completeGeneration(_deckId, sourceTextId, drafts) {
          return {
            ...failedSource,
            id: sourceTextId,
            generationStatus: "completed" as const,
            drafts: drafts.map((draft, index) => ({
              ...draft,
              id: `draft-${index + 1}`,
              sourceTextId,
              reviewStatus: "pending" as const,
            })),
          };
        },
        async getSourceWithDrafts() {
          return failedSource;
        },
      },
      generator: {
        async generate() {
          return [{ front: "høflig", back: "polite" }];
        },
      },
      maximumSourceTextCharacters: 20_000,
    });

    const completed = await generation.retry("deck-a", "source-1");

    expect(completed).toMatchObject({
      id: "source-1",
      generationStatus: "completed",
      drafts: [
        {
          front: "høflig",
          back: "polite",
          reviewStatus: "pending",
        },
      ],
    });
  });

  it.each<GenerationFailureCategory>([
    "provider_error",
    "refusal",
    "incomplete",
    "timeout",
  ])("retains a %s Source Text without Card Drafts", async (category) => {
    let retained = {
      id: "source-1",
      deckId: "deck-a",
      content: "Drosjesjåføren skal opptre høflig.",
      generationStatus: "ready" as "ready" | "completed" | "failed",
      drafts: [] as [],
    };
    const generation = createGenerationService({
      repository: {
        async createSource(_deckId, content) {
          retained = { ...retained, content };
          return retained;
        },
        async completeGeneration() {
          throw new Error("should not complete");
        },
        async failGeneration() {
          retained = { ...retained, generationStatus: "failed" };
          return retained;
        },
        async getSourceWithDrafts() {
          return retained;
        },
      },
      generator: {
        async generate() {
          throw new GenerationFailure(category);
        },
      },
      maximumSourceTextCharacters: 20_000,
    });

    await expect(
      generation.generate("deck-a", retained.content),
    ).rejects.toMatchObject({
      sourceTextId: "source-1",
      category,
    });
    expect(await generation.getSourceWithDrafts("deck-a", "source-1")).toEqual({
      ...retained,
      generationStatus: "failed",
      drafts: [],
    });
  });

  it("uses the saved Generation Instructions for a new attempt", async () => {
    const source = {
      id: "source-1",
      deckId: "deck-a",
      content: "Drosjesjåføren skal opptre høflig.",
      generationStatus: "ready" as const,
    };
    const generator = {
      async generate(input: {
        sourceText: string;
        generationInstructions: string;
      }) {
        expect(input.generationInstructions).toBe(
          "Prefer short, practical phrases.",
        );
        return [];
      },
    };
    const generation = createGenerationService({
      repository: {
        async createSource() {
          return source;
        },
        async completeGeneration() {
          return { ...source, generationStatus: "completed" as const, drafts: [] };
        },
        getSourceWithDrafts: vi.fn(),
      },
      generator,
      generationInstructions: {
        async get() {
          return "Prefer short, practical phrases.";
        },
      },
      maximumSourceTextCharacters: 20_000,
    });

    await generation.generate("deck-a", source.content);
  });

  it("rejects blank Source Text before retaining or generating anything", async () => {
    const repository = {
      createSource: vi.fn(),
      completeGeneration: vi.fn(),
      getSourceWithDrafts: vi.fn(),
    };
    const generator = { generate: vi.fn() };
    const generation = createGenerationService({
      repository,
      generator,
      maximumSourceTextCharacters: 20_000,
    });

    await expect(generation.generate("deck-a", " \n ")).rejects.toMatchObject({
      fieldErrors: { sourceText: "Enter Norwegian Source Text." },
    });
    expect(repository.createSource).not.toHaveBeenCalled();
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it("rejects Source Text beyond the configured guardrail", async () => {
    const repository = {
      createSource: vi.fn(),
      completeGeneration: vi.fn(),
      getSourceWithDrafts: vi.fn(),
    };
    const generator = { generate: vi.fn() };
    const generation = createGenerationService({
      repository,
      generator,
      maximumSourceTextCharacters: 10,
    });

    await expect(
      generation.generate("deck-a", "elleve tegn"),
    ).rejects.toMatchObject({
      fieldErrors: {
        sourceText: "Source Text must be 10 characters or fewer.",
      },
    });
    expect(repository.createSource).not.toHaveBeenCalled();
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it("retains Source Text before generating with the bundled instructions", async () => {
    const events: string[] = [];
    const source = {
      id: "source-1",
      deckId: "deck-a",
      content: "Drosjesjåføren skal opptre høflig.",
      generationStatus: "ready" as const,
    };
    const repository = {
      async createSource(_deckId: string, content: string) {
        events.push("source retained");
        return { ...source, content };
      },
      async completeGeneration() {
        events.push("drafts retained");
        return { ...source, generationStatus: "completed" as const, drafts: [] };
      },
      getSourceWithDrafts: vi.fn(),
    };
    const generator = {
      async generate(input: {
        sourceText: string;
        generationInstructions: string;
      }) {
        events.push("generator called");
        expect(input).toEqual({
          sourceText: source.content,
          generationInstructions: DEFAULT_GENERATION_TEMPLATE,
        });
        return [];
      },
    };
    const generation = createGenerationService({
      repository,
      generator,
      maximumSourceTextCharacters: 20_000,
    });

    await generation.generate("deck-a", source.content);

    expect(events).toEqual([
      "source retained",
      "generator called",
      "drafts retained",
    ]);
  });
});
