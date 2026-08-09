import Link from "next/link";
import type { Flashcard } from "@/application/flashcards";

export function FlashcardList({ flashcards }: { flashcards: Flashcard[] }) {
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2">
      {flashcards.map((flashcard) => (
        <li
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          key={flashcard.id}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Norwegian Front
            </p>
            <Link
              className="inline-flex shrink-0 items-center rounded-lg text-sm font-semibold text-sky-700 hover:bg-sky-50 hover:text-sky-900"
              href={`/cards/${flashcard.id}/edit`}
            >
              Edit Flashcard
            </Link>
          </div>
          <p className="mt-2 text-lg font-semibold leading-7 text-slate-950">
            {flashcard.front}
          </p>
          <div className="my-5 h-px bg-slate-100" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            English Back
          </p>
          <p className="mt-2 leading-7 text-slate-700">{flashcard.back}</p>
        </li>
      ))}
    </ul>
  );
}
