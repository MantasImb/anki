"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getFlashcardService } from "@/composition/flashcards";
import {
  submitAddFlashcardForm,
  type AddFlashcardFormState,
} from "@/interface/add-flashcard";

export async function addFlashcardToDeck(
  deckId: string,
  _previousState: AddFlashcardFormState,
  formData: FormData,
): Promise<AddFlashcardFormState> {
  const state = await submitAddFlashcardForm(
    getFlashcardService(),
    deckId,
    formData,
  );

  if (state.status === "created") {
    revalidatePath(`/decks/${deckId}`);
    redirect(`/decks/${deckId}`);
  }

  return state;
}
