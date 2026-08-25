"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getFlashcardDeckService } from "@/composition/collections";
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
