"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCardDraftReviewService } from "@/composition/draft-review";
import { getGenerationService } from "@/composition/generation";
import {
  submitCardDraftReview,
  type CardDraftReviewFormState,
} from "@/interface/review-card-draft";
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

export async function reviewCardDraft(
  sourceTextId: string,
  _previousState: CardDraftReviewFormState,
  formData: FormData,
): Promise<CardDraftReviewFormState> {
  const state = await submitCardDraftReview(
    getCardDraftReviewService(),
    sourceTextId,
    formData,
  );

  if (
    state.status === "saved" ||
    state.status === "approved" ||
    state.status === "rejected"
  ) {
    revalidatePath(`/sources/${sourceTextId}/drafts`);
    revalidatePath("/cards");
    revalidatePath("/");
  }

  return state;
}

export async function addRemainingCardDrafts(
  sourceTextId: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  await getCardDraftReviewService().approveRemaining(sourceTextId);
  revalidatePath(`/sources/${sourceTextId}/drafts`);
  revalidatePath("/cards");
  revalidatePath("/");
  redirect("/cards");
}
