import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DeleteFlashcardForm,
  EditFlashcardForm,
} from "@/app/cards/[id]/edit/edit-flashcard-form";
import { getFlashcardDeckService } from "@/composition/collections";
import { getFlashcardService } from "@/composition/flashcards";
import { deleteDeckFlashcard, editDeckFlashcard } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditDeckFlashcardPage({
  params,
}: {
  params: Promise<{ id: string; cardId: string }>;
}) {
  const { id, cardId } = await params;
  const [deck, flashcard] = await Promise.all([
    getFlashcardDeckService().get(id),
    getFlashcardService().get(id, cardId),
  ]);
  if (!deck || !flashcard) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-sky-700 hover:text-sky-900"
        href={`/decks/${deck.id}`}
      >
        ← {deck.name}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Edit Flashcard
      </h1>
      <p className="mt-3 max-w-xl leading-7 text-slate-600">
        Correct this Flashcard without changing its Recall Streak.
      </p>
      <EditFlashcardForm
        action={editDeckFlashcard.bind(null, deck.id, flashcard.id)}
        flashcard={flashcard}
      />
      <section className="mt-12 border-t border-slate-200 pt-8">
        <h2 className="text-lg font-semibold text-slate-950">Danger zone</h2>
        <p className="mt-2 max-w-xl leading-7 text-slate-600">
          Deleting this Flashcard permanently removes it from {deck.name}.
        </p>
        <DeleteFlashcardForm
          action={deleteDeckFlashcard.bind(null, deck.id, flashcard.id)}
        />
      </section>
    </main>
  );
}
