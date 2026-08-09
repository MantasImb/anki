"use server";

import { redirect } from "next/navigation";
import { getGenerationService } from "@/composition/generation";
import {
  submitGenerationRetry,
  type RetryGenerationState,
} from "@/interface/retry-generation";

export async function retryCardDraftGeneration(
  sourceTextId: string,
  _previousState: RetryGenerationState,
): Promise<RetryGenerationState> {
  void _previousState;
  const state = await submitGenerationRetry(
    getGenerationService(),
    sourceTextId,
  );

  if (state.status === "completed") {
    redirect(`/sources/${sourceTextId}/drafts`);
  }

  return state;
}
