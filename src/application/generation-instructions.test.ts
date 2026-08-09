import { describe, expect, it } from "vitest";
import {
  DEFAULT_GENERATION_TEMPLATE,
} from "./generation";
import { createGenerationInstructionsService } from "./generation-instructions";

describe("Generation Instructions", () => {
  it("saves edited instructions for later reads", async () => {
    let stored: string | undefined;
    const service = createGenerationInstructionsService({
      repository: {
        async get() {
          return stored;
        },
        async save(instructions) {
          stored = instructions;
          return instructions;
        },
      },
    });

    await service.save("Prefer short, practical phrases.");

    expect(await service.get()).toBe("Prefer short, practical phrases.");
  });

  it("restores the current bundled Default Generation Template", async () => {
    let stored = "Prefer short, practical phrases.";
    const service = createGenerationInstructionsService({
      repository: {
        async get() {
          return stored;
        },
        async save(instructions) {
          stored = instructions;
          return instructions;
        },
      },
    });

    await service.reset();

    expect(await service.get()).toBe(DEFAULT_GENERATION_TEMPLATE);
  });
});
