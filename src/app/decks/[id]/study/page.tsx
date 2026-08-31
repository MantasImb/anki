import Link from "next/link";
import { notFound } from "next/navigation";
import { StudySession } from "@/app/study/study-card";
import { createStudyScheduler } from "@/application/study";
import { getFlashcardDeckService } from "@/composition/collections";
import { getStudyService } from "@/composition/study";
import { recordDeckStudyAssessment } from "./actions";

export const dynamic = "force-dynamic";

export default async function DeckStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [deck, cards] = await Promise.all([
    getFlashcardDeckService().get(id),
    getStudyService().cards(id),
  ]);
  if (!deck) notFound();
  const flashcard = createStudyScheduler().next(cards);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-sky-700 hover:text-sky-900"
        href={`/decks/${deck.id}`}
      >
        ← {deck.name}
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Study Deck
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {deck.name}
      </h1>
      <p className="mt-3 leading-7 text-slate-600">
        Recall the English meaning, then reveal and assess your answer.
      </p>

      {flashcard ? (
        <StudySession
          action={recordDeckStudyAssessment.bind(null, deck.id)}
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
            Add a Flashcard to this Deck, then return here to study.
          </p>
          <Link
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800"
            href={`/decks/${deck.id}/cards/new`}
          >
            Add Flashcard
          </Link>
        </section>
      )}
    </main>
  );
}
