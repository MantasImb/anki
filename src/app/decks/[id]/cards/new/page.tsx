import Link from "next/link";
import { notFound } from "next/navigation";
import { AddFlashcardForm } from "@/app/cards/new/add-flashcard-form";
import { getFlashcardDeckService } from "@/composition/collections";
import { addFlashcardToDeck } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewDeckFlashcardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deck = await getFlashcardDeckService().get(id);
  if (!deck) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-sky-700 hover:text-sky-900"
        href={`/decks/${deck.id}`}
      >
        ← {deck.name}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Add Flashcard
      </h1>
      <p className="mt-3 max-w-xl leading-7 text-slate-600">
        Add one Norwegian Front and English Back to {deck.name}.
      </p>
      <AddFlashcardForm action={addFlashcardToDeck.bind(null, deck.id)} />
    </main>
  );
}
