"use server";

import { redirect } from "next/navigation";
import type { CardDraftReviewFormState } from "@/interface/review-card-draft";
import type { RetryGenerationState } from "@/interface/retry-generation";

export async function retryCardDraftGeneration(
  sourceTextId: string,
  _previousState: RetryGenerationState,
): Promise<RetryGenerationState> {
  void sourceTextId;
  void _previousState;
  redirect("/decks");
}

export async function reviewCardDraft(
  sourceTextId: string,
  _previousState: CardDraftReviewFormState,
  formData: FormData,
): Promise<CardDraftReviewFormState> {
  void sourceTextId;
  void formData;
  redirect("/decks");
}

export async function addRemainingCardDrafts(
  sourceTextId: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  void sourceTextId;
  redirect("/decks");
}
