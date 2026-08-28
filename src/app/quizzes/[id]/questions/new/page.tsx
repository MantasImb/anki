import { notFound } from "next/navigation";
import { QuestionForm } from "@/app/quizzes/question-form";
import { getQuizService } from "@/composition/collections";
import { saveNewQuestion } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuizService().get(id);
  if (!quiz) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{quiz.name}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Add Question</h1>
      <p className="mt-3 leading-7 text-slate-600">
        Enter the Norwegian prompt and options, translate them to editable English, then review before saving.
      </p>
      <QuestionForm action={saveNewQuestion.bind(null, id)} />
    </main>
  );
}
