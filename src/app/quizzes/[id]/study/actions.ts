"use server";

import { revalidatePath } from "next/cache";
import { getQuizStudyService } from "@/composition/quiz-study";
import { submitQuizAnswer } from "@/interface/record-quiz-result";

export async function recordQuizStudyAnswer(
  quizId: string,
  formData: FormData,
) {
  const recorded = await submitQuizAnswer(
    getQuizStudyService(),
    quizId,
    formData,
  );
  revalidatePath(`/quizzes/${quizId}`);
  return recorded;
}
