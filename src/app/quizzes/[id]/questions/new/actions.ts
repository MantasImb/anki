"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getQuizQuestionService } from "@/composition/quiz-questions";
import { getQuestionTranslationService } from "@/composition/question-translation";
import {
  manageQuizQuestionForm,
  type QuizQuestionFormState,
} from "@/interface/manage-quiz-question";

export async function saveNewQuestion(
  quizId: string,
  _previousState: QuizQuestionFormState,
  formData: FormData,
): Promise<QuizQuestionFormState> {
  const state = await manageQuizQuestionForm(
    getQuizQuestionService(),
    getQuestionTranslationService(),
    quizId,
    undefined,
    formData,
  );
  if (state.status === "saved") {
    revalidatePath(`/quizzes/${quizId}`);
    redirect(
      state.intent === "save-and-add-another"
        ? `/quizzes/${quizId}/questions/new`
        : `/quizzes/${quizId}`,
    );
  }
  return state;
}
