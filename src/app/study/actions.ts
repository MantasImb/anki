"use server";

import { revalidatePath } from "next/cache";
import { getStudyService } from "@/composition/study";
import { submitStudyAssessment } from "@/interface/record-study-result";

export async function recordStudyAssessment(formData: FormData) {
  const deckId = formData.get("deckId");
  if (typeof deckId !== "string" || !deckId) {
    throw new Error("Select a Flashcard Deck before studying.");
  }
  const recorded = await submitStudyAssessment(
    getStudyService(),
    deckId,
    formData,
  );

  revalidatePath("/cards");
  return recorded;
}
