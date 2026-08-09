import Link from "next/link";
import { AddFlashcardForm } from "./add-flashcard-form";
import { addFlashcard } from "./actions";

export default function NewFlashcardPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-sky-700 hover:text-sky-900"
        href="/cards"
      >
        ← All Flashcards
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Add Flashcard
      </h1>
      <p className="mt-3 max-w-xl leading-7 text-slate-600">
        Add one Norwegian prompt and its English translation. It will be ready
        to study as soon as it is saved.
      </p>
      <AddFlashcardForm action={addFlashcard} />
    </main>
  );
}
