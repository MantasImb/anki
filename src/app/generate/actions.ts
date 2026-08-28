"use server";

import { redirect } from "next/navigation";
import { getGenerationService } from "@/composition/generation";
import {
  submitGenerationForm,
  type GenerationFormState,
} from "@/interface/generate-card-drafts";

export async function generateCardDrafts(
  deckId: string,
  _previousState: GenerationFormState,
  formData: FormData,
): Promise<GenerationFormState> {
  const state = await submitGenerationForm(
    getGenerationService(),
    deckId,
    formData,
  );

  if (state.status === "generated" || state.status === "failed") {
    redirect(`/decks/${deckId}/sources/${state.sourceTextId}/drafts`);
  }

  return state;
}
