"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { FlashcardNotFoundError } from "@/application/flashcards";
import { getFlashcardService } from "@/composition/flashcards";
import {
  submitEditFlashcardForm,
  type EditFlashcardFormState,
} from "@/interface/maintain-flashcard";

export async function editDeckFlashcard(
  deckId: string,
  cardId: string,
  _previousState: EditFlashcardFormState,
  formData: FormData,
): Promise<EditFlashcardFormState> {
  let state: EditFlashcardFormState;
  try {
    state = await submitEditFlashcardForm(
      getFlashcardService(),
      deckId,
      cardId,
      formData,
    );
  } catch (error) {
    if (error instanceof FlashcardNotFoundError) notFound();
    throw error;
  }

  if (state.status === "updated") {
    revalidatePath(`/decks/${deckId}`);
    redirect(`/decks/${deckId}`);
  }
  return state;
}

export async function deleteDeckFlashcard(
  deckId: string,
  cardId: string,
): Promise<void> {
  try {
    await getFlashcardService().delete(deckId, cardId);
  } catch (error) {
    if (error instanceof FlashcardNotFoundError) notFound();
    throw error;
  }

  revalidatePath(`/decks/${deckId}`);
  redirect(`/decks/${deckId}`);
}
