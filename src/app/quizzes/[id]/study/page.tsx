import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizStudySession } from "@/app/quizzes/quiz-study";
import {
  createQuizStudyScheduler,
  prepareQuizStudyQuestion,
} from "@/application/quiz-study";
import { getQuizService } from "@/composition/collections";
import { getQuizStudyService } from "@/composition/quiz-study";
import { getQuestionImageService } from "@/composition/question-images";
import { recordQuizStudyAnswer } from "./actions";

export const dynamic = "force-dynamic";

export default async function QuizStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quiz, allQuestions] = await Promise.all([
    getQuizService().get(id),
    getQuizStudyService().questions(id),
  ]);
  if (!quiz) notFound();

  const imageService = allQuestions.some(({ image }) => image)
    ? getQuestionImageService()
    : undefined;
  const questions = await Promise.all(allQuestions.map(async (stored) => {
    const question = prepareQuizStudyQuestion(stored);
    return {
      ...question,
      ...(question.image && imageService
        ? { imageUrl: await imageService.readUrl(question.image) }
        : {}),
    };
  }));
  const question = createQuizStudyScheduler().next(questions);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-sky-700 hover:text-sky-900"
        href={`/quizzes/${quiz.id}`}
      >
        ← {quiz.name}
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Study Quiz
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {quiz.name}
      </h1>
      <p className="mt-3 leading-7 text-slate-600">
        Choose the correct answer or answers, submit once, then review the feedback.
      </p>

      {question ? (
        <QuizStudySession
          action={recordQuizStudyAnswer.bind(null, quiz.id)}
          initialAttemptId={crypto.randomUUID()}
          initialQuestionId={question.id}
          questions={questions}
        />
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <h2 className="text-xl font-semibold text-slate-950">
            No Questions to study
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
            Add a Question, then return here.
          </p>
          <Link
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white"
            href={`/quizzes/${quiz.id}/questions/new`}
          >
            Add Question
          </Link>
        </section>
      )}
    </main>
  );
}
