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

function draftsPath(deckId: string, sourceTextId: string) {
  return `/decks/${deckId}/sources/${sourceTextId}/drafts`;
}

export async function retryCardDraftGeneration(
  deckId: string,
  sourceTextId: string,
  _previousState: RetryGenerationState,
): Promise<RetryGenerationState> {
  void _previousState;
  const state = await submitGenerationRetry(
    getGenerationService(),
    deckId,
    sourceTextId,
  );
  if (state.status === "completed") redirect(draftsPath(deckId, sourceTextId));
  return state;
}

export async function reviewCardDraft(
  deckId: string,
  sourceTextId: string,
  _previousState: CardDraftReviewFormState,
  formData: FormData,
): Promise<CardDraftReviewFormState> {
  const state = await submitCardDraftReview(
    getCardDraftReviewService(),
    deckId,
    sourceTextId,
    formData,
  );
  if (["saved", "approved", "rejected"].includes(state.status)) {
    revalidatePath(draftsPath(deckId, sourceTextId));
    revalidatePath(`/decks/${deckId}`);
  }
  return state;
}

export async function addRemainingCardDrafts(
  deckId: string,
  sourceTextId: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  await getCardDraftReviewService().approveRemaining(deckId, sourceTextId);
  revalidatePath(draftsPath(deckId, sourceTextId));
  revalidatePath(`/decks/${deckId}`);
  redirect(`/decks/${deckId}`);
}
