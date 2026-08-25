import { getQuizService } from "@/composition/collections";
import { CollectionIndex } from "../collections/collection-index";
import { createQuiz } from "./actions";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const quizzes = await getQuizService().list();
  return (
    <CollectionIndex
      action={createQuiz}
      basePath="/quizzes"
      collections={quizzes}
      collectionType="Quiz"
    />
  );
}
