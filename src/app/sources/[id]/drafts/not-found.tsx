import Link from "next/link";

export default function SourceDraftsNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-14 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
        Generated drafts not found
      </h1>
      <p className="mt-3 leading-7 text-slate-600">
        This Source Text does not exist or is no longer available.
      </p>
      <Link
        className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800 sm:w-auto"
        href="/generate"
      >
        Generate Card Drafts
      </Link>
    </main>
  );
}
