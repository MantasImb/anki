import Link from "next/link";

export default function FlashcardNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-14 text-center sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Flashcard not found
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        This Flashcard is no longer available
      </h1>
      <p className="mx-auto mt-4 max-w-lg leading-7 text-slate-600">
        It may have already been deleted, or the link may be incorrect.
      </p>
      <Link
        className="mx-auto mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800"
        href="/cards"
      >
        Return to Flashcards
      </Link>
    </main>
  );
}
