"use server";

import { revalidatePath } from "next/cache";
import { getGenerationInstructionsService } from "@/composition/generation-instructions";
import {
  submitGenerationInstructionsForm,
  type GenerationInstructionsFormState,
} from "@/interface/manage-generation-instructions";

export async function saveGenerationInstructions(
  _previousState: GenerationInstructionsFormState,
  formData: FormData,
) {
  const state = await submitGenerationInstructionsForm(
    getGenerationInstructionsService(),
    formData,
  );

  if (state.status === "saved") {
    revalidatePath("/settings/generation");
  }

  return state;
}

export async function resetGenerationInstructions() {
  await getGenerationInstructionsService().reset();
  revalidatePath("/settings/generation");
}
