import "server-only";

import OpenAI from "openai";
import { createOpenAICardDraftGenerator } from "@/adapters/generation/openai-card-draft-generator";
import {
  getMaximumSourceTextCharacters,
  requireOpenAIConfiguration,
} from "@/adapters/generation/openai-configuration";
import { getPostgresGenerationRepository } from "@/adapters/persistence/postgres/database";
import { createGenerationService } from "@/application/generation";
import { getGenerationInstructionsService } from "./generation-instructions";

function getGenerationConfiguration() {
  return requireOpenAIConfiguration(process.env);
}

export function getGenerationFormConfiguration() {
  return {
    maximumSourceTextCharacters: getMaximumSourceTextCharacters(process.env),
  };
}

export function getGenerationService() {
  const configuration = getGenerationConfiguration();
  const client = new OpenAI({
    apiKey: configuration.apiKey,
    maxRetries: 0,
    timeout: configuration.timeoutMilliseconds,
  });
  const generator = createOpenAICardDraftGenerator({
    model: configuration.model,
    parse: (request) => client.responses.parse(request),
  });

  return createGenerationService({
    repository: getPostgresGenerationRepository(),
    generator,
    generationInstructions: getGenerationInstructionsService(),
    logger: {
      generationFailed(event) {
        console.error("Generation attempt failed", event);
      },
    },
    maximumSourceTextCharacters:
      configuration.maximumSourceTextCharacters,
  });
}

export function getSourceWithDrafts(id: string) {
  return getPostgresGenerationRepository().getSourceWithDrafts(id);
}
