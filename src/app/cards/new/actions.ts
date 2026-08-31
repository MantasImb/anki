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
  const deckId = formData.get("deckId");
  if (typeof deckId !== "string" || !deckId) {
    redirect("/decks");
  }
  const state = await submitAddFlashcardForm(getFlashcardService(), deckId, formData);

  if (state.status === "created") {
    revalidatePath("/");
    revalidatePath("/cards");
    redirect("/cards");
  }

  return state;
}
