import Link from "next/link";
import { createStudyScheduler } from "@/application/study";
import { getStudyService } from "@/composition/study";
import { recordStudyAssessment } from "./actions";
import { StudySession } from "./study-card";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const cards = await getStudyService().cards();
  const flashcard = createStudyScheduler().next(cards);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Study session
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Practice Norwegian
      </h1>
      <p className="mt-3 leading-7 text-slate-600">
        Recall the English meaning, then reveal and assess your answer.
      </p>

      {flashcard ? (
        <StudySession
          action={recordStudyAssessment}
          cards={cards}
          initialAttemptId={crypto.randomUUID()}
          initialCardId={flashcard.id}
        />
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <h2 className="text-xl font-semibold text-slate-950">
            No Flashcards to study
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
            Add or generate a Flashcard, then return here to begin studying.
          </p>
          <Link
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white transition hover:bg-sky-800"
            href="/cards/new"
          >
            Add Flashcard
          </Link>
        </section>
      )}
    </main>
  );
}
