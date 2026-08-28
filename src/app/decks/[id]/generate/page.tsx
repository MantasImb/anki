import Link from "next/link";
import { notFound } from "next/navigation";
import { generateCardDrafts } from "@/app/generate/actions";
import { GenerationForm } from "@/app/generate/generation-form";
import { getFlashcardDeckService } from "@/composition/collections";
import { getGenerationFormConfiguration } from "@/composition/generation";

export const dynamic = "force-dynamic";

export default async function GenerateDeckFlashcardsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deck = await getFlashcardDeckService().get(id);
  if (!deck) notFound();
  const { maximumSourceTextCharacters } = getGenerationFormConfiguration();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-sky-700 hover:text-sky-900"
        href={`/decks/${deck.id}`}
      >
        ← {deck.name}
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Generate for {deck.name}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Create Card Drafts
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Turn Norwegian Source Text into editable Norwegian Front and English
        Back suggestions for this Deck.
      </p>
      <GenerationForm
        action={generateCardDrafts.bind(null, deck.id)}
        maximumCharacters={maximumSourceTextCharacters}
      />
    </main>
  );
}
