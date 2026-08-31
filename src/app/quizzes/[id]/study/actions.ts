"use server";

import { revalidatePath } from "next/cache";
import { getQuestionImageService } from "@/composition/question-images";
import { getQuizQuestionService } from "@/composition/quiz-questions";
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

export async function refreshQuizQuestionImage(
  quizId: string,
  questionId: string,
) {
  const question = await getQuizQuestionService().get(quizId, questionId);
  if (!question?.image) return undefined;
  return getQuestionImageService().readUrl(question.image);
}
