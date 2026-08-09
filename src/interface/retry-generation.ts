import {
  GenerationAttemptFailedError,
  type createGenerationService,
} from "../application/generation";

type GenerationService = ReturnType<typeof createGenerationService>;

export type RetryGenerationState =
  | { status: "idle" }
  | { status: "completed" }
  | { status: "failed" };

export async function submitGenerationRetry(
  generation: Pick<GenerationService, "retry">,
  sourceTextId: string,
): Promise<RetryGenerationState> {
  try {
    await generation.retry(sourceTextId);
    return { status: "completed" };
  } catch (error) {
    if (error instanceof GenerationAttemptFailedError) {
      return { status: "failed" };
    }

    throw error;
  }
}
