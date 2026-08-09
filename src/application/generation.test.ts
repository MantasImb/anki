import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GENERATION_TEMPLATE,
  createGenerationService,
} from "./generation";

describe("Source Text generation", () => {
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

    await expect(generation.generate(" \n ")).rejects.toMatchObject({
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

    await expect(generation.generate("elleve tegn")).rejects.toMatchObject({
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
      content: "Drosjesjåføren skal opptre høflig.",
      generationStatus: "ready" as const,
    };
    const repository = {
      async createSource(content: string) {
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

    await generation.generate(source.content);

    expect(events).toEqual([
      "source retained",
      "generator called",
      "drafts retained",
    ]);
  });
});
