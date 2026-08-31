import Link from "next/link";
import { FlashcardList } from "@/app/cards/flashcard-list";
import type { Collection } from "@/application/collections";
import {
  calculateDeckProgress,
  type Flashcard,
} from "@/application/flashcards";
import {
  DeleteCollectionForm,
  type DeleteCollectionFormState,
} from "@/app/collections/delete-collection-form";

export function DeckDetail({
  deck,
  flashcards,
  deleteAction,
}: {
  deck: Collection;
  flashcards: Flashcard[];
  deleteAction: (
    state: DeleteCollectionFormState,
    formData: FormData,
  ) => Promise<DeleteCollectionFormState>;
}) {
  const basePath = `/decks/${deck.id}`;
  const progress = calculateDeckProgress(flashcards);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Flashcard Deck
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {deck.name}
      </h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800"
          href={`${basePath}/cards/new`}
        >
          Add Flashcard
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 font-semibold text-sky-800 hover:bg-sky-100"
          href={`${basePath}/generate`}
        >
          Generate Flashcards
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50"
          href={`${basePath}/study`}
        >
          Study Deck
        </Link>
      </div>

      {flashcards.length > 0 ? (
        <>
          <p className="mt-8 text-sm font-medium text-slate-600">
            Deck Progress: {progress.percentage}% Learned
          </p>
          <FlashcardList deckId={deck.id} flashcards={flashcards} />
        </>
      ) : (
        <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <h2 className="text-xl font-semibold text-slate-950">No cards yet</h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
            Add a Norwegian Front and English Back to this Deck.
          </p>
        </section>
      )}
      <section className="mt-12 border-t border-slate-200 pt-8">
        <h2 className="text-lg font-semibold text-slate-950">Danger zone</h2>
        <p className="mt-2 max-w-xl leading-7 text-slate-600">
          Deleting this Deck permanently removes all of its active Flashcards.
          Study Result history is retained.
        </p>
        <DeleteCollectionForm
          action={deleteAction}
          collectionType="Flashcard Deck"
          itemCount={flashcards.length}
          itemName="Flashcard"
        />
      </section>
    </main>
  );
}
