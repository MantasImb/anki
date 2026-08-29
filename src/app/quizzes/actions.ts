"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getQuizService } from "@/composition/collections";
import type { DeleteCollectionFormState } from "@/app/collections/delete-collection-form";
import {
  submitCreateCollectionForm,
  type CreateCollectionFormState,
} from "@/interface/create-collection";

export async function createQuiz(
  _previousState: CreateCollectionFormState,
  formData: FormData,
): Promise<CreateCollectionFormState> {
  const state = await submitCreateCollectionForm(
    getQuizService(),
    "Quiz",
    formData,
  );
  if (state.status === "created") {
    revalidatePath("/quizzes");
    redirect(`/quizzes/${state.collectionId}`);
  }
  return state;
}

export async function deleteQuiz(
  quizId: string,
  _previousState: DeleteCollectionFormState,
  _formData: FormData,
): Promise<DeleteCollectionFormState> {
  void _previousState;
  void _formData;
  try {
    await getQuizService().delete(quizId);
  } catch {
    return {
      status: "failed",
      message: "Quiz could not be deleted. Refresh and try again.",
    };
  }
  revalidatePath("/quizzes");
  redirect("/quizzes");
}
