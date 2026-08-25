import Link from "next/link";

export function PrimaryNavigation() {
  return (
    <nav className="mx-auto flex min-h-16 w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 sm:px-8">
      <Link className="font-semibold text-slate-950" href="/">
        Norwegian Learning
      </Link>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        <Link
          className="text-sm font-semibold text-sky-700 hover:text-sky-900"
          href="/decks"
        >
          Flashcard Decks
        </Link>
        <Link
          className="text-sm font-semibold text-sky-700 hover:text-sky-900"
          href="/quizzes"
        >
          Quizzes
        </Link>
        <Link
          className="text-sm font-semibold text-sky-700 hover:text-sky-900"
          href="/settings/generation"
        >
          Settings
        </Link>
      </div>
    </nav>
  );
}
