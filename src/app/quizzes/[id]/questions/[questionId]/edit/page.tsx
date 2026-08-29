import { notFound } from "next/navigation";
import { QuestionForm } from "@/app/quizzes/question-form";
import { getQuizService } from "@/composition/collections";
import { getQuizQuestionService } from "@/composition/quiz-questions";
import { getQuestionImageService } from "@/composition/question-images";
import { saveQuestionEdit } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string; questionId: string }>;
}) {
  const { id, questionId } = await params;
  const [quiz, question] = await Promise.all([
    getQuizService().get(id),
    getQuizQuestionService().get(id, questionId),
  ]);
  if (!quiz || !question) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{quiz.name}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Edit Question</h1>
      <QuestionForm
        action={saveQuestionEdit.bind(null, id, questionId)}
        imageUrl={question.image
          ? await getQuestionImageService().readUrl(question.image)
          : undefined}
        question={question}
      />
    </main>
  );
}
