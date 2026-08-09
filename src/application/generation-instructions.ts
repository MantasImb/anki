import { DEFAULT_GENERATION_TEMPLATE } from "./generation";

export interface GenerationInstructionsRepository {
  get(): Promise<string | undefined>;
  save(instructions: string): Promise<string>;
}

export class GenerationInstructionsValidationError extends Error {
  constructor(readonly fieldErrors: { instructions: string }) {
    super("Generation Instructions are invalid.");
    this.name = "GenerationInstructionsValidationError";
  }
}

export function createGenerationInstructionsService({
  repository,
}: {
  repository: GenerationInstructionsRepository;
}) {
  return {
    async get() {
      return (await repository.get()) ?? DEFAULT_GENERATION_TEMPLATE;
    },
    async save(instructions: string) {
      if (!instructions.trim()) {
        throw new GenerationInstructionsValidationError({
          instructions: "Enter Generation Instructions.",
        });
      }

      return repository.save(instructions);
    },
    reset() {
      return repository.save(DEFAULT_GENERATION_TEMPLATE);
    },
  };
}
