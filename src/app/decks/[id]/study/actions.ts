"use server";

import { revalidatePath } from "next/cache";
import { getStudyService } from "@/composition/study";
import { submitStudyAssessment } from "@/interface/record-study-result";

export async function recordDeckStudyAssessment(
  deckId: string,
  formData: FormData,
) {
  const recorded = await submitStudyAssessment(
    getStudyService(),
    deckId,
    formData,
  );
  revalidatePath(`/decks/${deckId}`);
  return recorded;
}
