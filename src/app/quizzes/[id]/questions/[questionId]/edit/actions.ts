"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DeleteQuestionFormState } from "@/app/quizzes/delete-question-form";
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

export async function deleteQuestion(
  quizId: string,
  questionId: string,
  _previousState: DeleteQuestionFormState,
  _formData: FormData,
): Promise<DeleteQuestionFormState> {
  void _previousState;
  void _formData;
  try {
    await getQuizQuestionService().delete(quizId, questionId);
  } catch {
    return {
      status: "failed",
      message: "Question could not be deleted. Refresh and try again.",
    };
  }
  revalidatePath(`/quizzes/${quizId}`);
  redirect(`/quizzes/${quizId}`);
}
