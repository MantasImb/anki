import "server-only";

import { getPostgresGenerationInstructionsRepository } from "@/adapters/persistence/postgres/database";
import { createGenerationInstructionsService } from "@/application/generation-instructions";

export function getGenerationInstructionsService() {
  return createGenerationInstructionsService({
    repository: getPostgresGenerationInstructionsRepository(),
  });
}
