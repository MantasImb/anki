"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getQuizQuestionService } from "@/composition/quiz-questions";
import { getQuestionTranslationService } from "@/composition/question-translation";
import {
  manageQuizQuestionForm,
  type QuizQuestionFormState,
} from "@/interface/manage-quiz-question";

export async function saveQuestionEdit(
  quizId: string,
  questionId: string,
  _previousState: QuizQuestionFormState,
  formData: FormData,
): Promise<QuizQuestionFormState> {
  const state = await manageQuizQuestionForm(
    getQuizQuestionService(),
    getQuestionTranslationService(),
    quizId,
    questionId,
    formData,
  );
  if (state.status === "saved") {
    revalidatePath(`/quizzes/${quizId}`);
    redirect(`/quizzes/${quizId}`);
  }
  return state;
}
