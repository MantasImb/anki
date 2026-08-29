import Link from "next/link";
import type { Collection } from "@/application/collections";
import type { QuizQuestion } from "@/application/quiz-questions";
import { calculateQuizProgress } from "@/application/quiz-study";

export function QuizDetail({
  quiz,
  questions,
}: {
  quiz: Collection;
  questions: Array<QuizQuestion & { imageUrl?: string }>;
}) {
  const basePath = `/quizzes/${quiz.id}`;
  const progress = calculateQuizProgress(questions);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Quiz</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{quiz.name}</h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white" href={`${basePath}/questions/new`}>
          Add Question
        </Link>
        <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800" href={`${basePath}/study`}>
          Study Quiz
        </Link>
      </div>

      {questions.length === 0 ? (
        <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <h2 className="text-xl font-semibold text-slate-950">No questions yet</h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
            Add a Norwegian Quiz Question and Answer Options to this Quiz.
          </p>
        </section>
      ) : (
        <div className="mt-8 space-y-5">
          <p className="text-sm font-medium text-slate-600">
            Quiz Progress: {progress.percentage}% Learned
          </p>
          {questions.map((question) => (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={question.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-950">{question.promptNorwegian}</p>
                  <p className="mt-1 text-sm text-slate-600">{question.promptEnglish}</p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Recall Streak {question.recallStreak}/3
                  </p>
                </div>
                <Link className="shrink-0 text-sm font-semibold text-sky-700" href={`${basePath}/questions/${question.id}/edit`}>
                  Edit Question
                </Link>
              </div>
              {question.image && question.imageUrl ? (
                <>
                  {/* Direct rendering preserves browser-supported animated GIF behavior. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`Question Image for ${question.promptNorwegian}`}
                    className="mt-5 max-h-96 w-full rounded-xl object-contain"
                    src={question.imageUrl}
                  />
                </>
              ) : null}
              <ol className="mt-5 space-y-3">
                {question.options.map((option) => (
                  <li className="rounded-xl bg-slate-50 px-4 py-3" key={option.id}>
                    <span className="font-medium text-slate-900">{option.norwegian}</span>{" — "}
                    <span className="text-slate-600">{option.english}</span>{" — "}
                    <span className="text-xs font-semibold text-slate-500">{option.isCorrect ? "Correct" : "Incorrect"}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
