import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Norwegian learning
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
        Norwegian Flashcards
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
        Create Norwegian-to-English flashcards and study the same collection
        from your phone or desktop.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white transition hover:bg-sky-800"
          href="/generate"
        >
          Generate Card Drafts
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          href="/cards/new"
        >
          Add Flashcard
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          href="/cards"
        >
          Browse collection
        </Link>
      </div>
    </main>
  );
}
