"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { FlashcardNotFoundError } from "@/application/flashcards";
import { getFlashcardService } from "@/composition/flashcards";
import {
  submitEditFlashcardForm,
  type EditFlashcardFormState,
} from "@/interface/maintain-flashcard";

export async function editFlashcard(
  id: string,
  _previousState: EditFlashcardFormState,
  formData: FormData,
): Promise<EditFlashcardFormState> {
  let state: EditFlashcardFormState;

  try {
    state = await submitEditFlashcardForm(
      getFlashcardService(),
      id,
      formData,
    );
  } catch (error) {
    if (error instanceof FlashcardNotFoundError) {
      notFound();
    }

    throw error;
  }

  if (state.status === "updated") {
    revalidatePath("/");
    revalidatePath("/cards");
    redirect("/cards");
  }

  return state;
}

export async function deleteFlashcard(id: string): Promise<void> {
  try {
    await getFlashcardService().delete(id);
  } catch (error) {
    if (error instanceof FlashcardNotFoundError) {
      notFound();
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/cards");
  redirect("/cards");
}
