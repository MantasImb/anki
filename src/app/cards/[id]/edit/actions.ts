"use server";

import { redirect } from "next/navigation";
import type { EditFlashcardFormState } from "@/interface/maintain-flashcard";

export async function editFlashcard(
  id: string,
  _previousState: EditFlashcardFormState,
  formData: FormData,
): Promise<EditFlashcardFormState> {
  void id;
  void formData;
  redirect("/decks");
}

export async function deleteFlashcard(id: string): Promise<void> {
  void id;
  redirect("/decks");
}
