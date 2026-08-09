"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getFlashcardService } from "@/composition/flashcards";
import {
  submitAddFlashcardForm,
  type AddFlashcardFormState,
} from "@/interface/add-flashcard";

export async function addFlashcard(
  _previousState: AddFlashcardFormState,
  formData: FormData,
): Promise<AddFlashcardFormState> {
  const state = await submitAddFlashcardForm(getFlashcardService(), formData);

  if (state.status === "created") {
    revalidatePath("/");
    revalidatePath("/cards");
    redirect("/cards");
  }

  return state;
}
