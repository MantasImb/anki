"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStudyService } from "@/composition/study";
import { submitStudyAssessment } from "@/interface/record-study-result";

export async function recordStudyAssessment(formData: FormData): Promise<void> {
  const { flashcardId } = await submitStudyAssessment(
    getStudyService(),
    formData,
  );

  revalidatePath("/study");
  revalidatePath("/cards");
  redirect(`/study?after=${flashcardId}`);
}
