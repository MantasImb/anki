"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getQuizService } from "@/composition/collections";
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
