"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getFlashcardDeckService } from "@/composition/collections";
import type { DeleteCollectionFormState } from "@/app/collections/delete-collection-form";
import {
  submitCreateCollectionForm,
  type CreateCollectionFormState,
} from "@/interface/create-collection";

export async function createDeck(
  _previousState: CreateCollectionFormState,
  formData: FormData,
): Promise<CreateCollectionFormState> {
  const state = await submitCreateCollectionForm(
    getFlashcardDeckService(),
    "Flashcard Deck",
    formData,
  );
  if (state.status === "created") {
    revalidatePath("/decks");
    redirect(`/decks/${state.collectionId}`);
  }
  return state;
}

export async function deleteDeck(
  deckId: string,
  _previousState: DeleteCollectionFormState,
  _formData: FormData,
): Promise<DeleteCollectionFormState> {
  void _previousState;
  void _formData;
  try {
    await getFlashcardDeckService().delete(deckId);
  } catch {
    return {
      status: "failed",
      message: "Flashcard Deck could not be deleted. Refresh and try again.",
    };
  }
  revalidatePath("/decks");
  redirect("/decks");
}
