import Link from "next/link";
import { getFlashcardService } from "@/composition/flashcards";
import { FlashcardList } from "./flashcard-list";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const flashcards = await getFlashcardService().list();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Collection
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Flashcards
          </h1>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white transition hover:bg-sky-800"
          href="/cards/new"
        >
          Add Flashcard
        </Link>
      </div>

      {flashcards.length === 0 ? (
        <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <h2 className="text-xl font-semibold text-slate-950">
            No Flashcards yet
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
            Add a Norwegian Front and English Back to begin your collection.
          </p>
        </section>
      ) : (
        <FlashcardList flashcards={flashcards} />
      )}
    </main>
  );
}
