import Link from "next/link";
import { notFound } from "next/navigation";
import { getFlashcardService } from "@/composition/flashcards";
import { deleteFlashcard, editFlashcard } from "./actions";
import {
  DeleteFlashcardForm,
  EditFlashcardForm,
} from "./edit-flashcard-form";

export default async function EditFlashcardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flashcard = await getFlashcardService().get(id);

  if (!flashcard) {
    notFound();
  }

  const editAction = editFlashcard.bind(null, flashcard.id);
  const deleteAction = deleteFlashcard.bind(null, flashcard.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-sky-700 hover:text-sky-900"
        href="/cards"
      >
        ← All Flashcards
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Edit Flashcard
      </h1>
      <p className="mt-3 max-w-xl leading-7 text-slate-600">
        Correct the Norwegian prompt or English translation without changing
        this Flashcard&apos;s study progress.
      </p>

      <EditFlashcardForm action={editAction} flashcard={flashcard} />

      <section className="mt-12 border-t border-slate-200 pt-8">
        <h2 className="text-lg font-semibold text-slate-950">Danger zone</h2>
        <p className="mt-2 max-w-xl leading-7 text-slate-600">
          Deleting this Flashcard permanently removes it from the collection.
        </p>
        <DeleteFlashcardForm action={deleteAction} />
      </section>
    </main>
  );
}
