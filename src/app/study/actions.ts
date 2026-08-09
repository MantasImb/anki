"use server";

import { revalidatePath } from "next/cache";
import { getStudyService } from "@/composition/study";
import { submitStudyAssessment } from "@/interface/record-study-result";

export async function recordStudyAssessment(formData: FormData) {
  const recorded = await submitStudyAssessment(
    getStudyService(),
    formData,
  );

  revalidatePath("/cards");
  return recorded;
}
