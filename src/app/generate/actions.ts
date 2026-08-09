"use server";

import { redirect } from "next/navigation";
import { getGenerationService } from "@/composition/generation";
import {
  submitGenerationForm,
  type GenerationFormState,
} from "@/interface/generate-card-drafts";

export async function generateCardDrafts(
  _previousState: GenerationFormState,
  formData: FormData,
): Promise<GenerationFormState> {
  const state = await submitGenerationForm(getGenerationService(), formData);

  if (state.status === "generated") {
    redirect(`/sources/${state.sourceTextId}/drafts`);
  }

  return state;
}
