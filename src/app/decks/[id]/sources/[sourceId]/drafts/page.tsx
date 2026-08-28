import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftReview } from "@/app/sources/[id]/drafts/draft-review";
import { RetryGeneration } from "@/app/sources/[id]/drafts/retry-generation";
import { getFlashcardDeckService } from "@/composition/collections";
import { getSourceWithDrafts } from "@/composition/generation";
import {
  addRemainingCardDrafts,
  retryCardDraftGeneration,
  reviewCardDraft,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function DeckSourceDraftsPage({
  params,
}: {
  params: Promise<{ id: string; sourceId: string }>;
}) {
  const { id, sourceId } = await params;
  const [deck, source] = await Promise.all([
    getFlashcardDeckService().get(id),
    getSourceWithDrafts(id, sourceId),
  ]);
  if (!deck || !source) notFound();
  const generatePath = `/decks/${deck.id}/generate`;

  if (source.generationStatus === "failed") {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <Link className="text-sm font-semibold text-sky-700" href={generatePath}>
          ← Back to generation
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
          Generation interrupted
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Card Drafts weren&apos;t generated
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Your Source Text and target Deck are safely retained. Try again
          without pasting it a second time.
        </p>
        <RetryGeneration
          action={retryCardDraftGeneration.bind(null, deck.id, source.id)}
        />
      </main>
    );
  }

  if (source.generationStatus !== "completed") notFound();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-sky-700" href={generatePath}>
        ← Generate more for {deck.name}
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Generation complete · {deck.name}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Review Card Drafts
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Edit or remove drafts, then add everything remaining to this Deck.
      </p>
      <DraftReview
        action={reviewCardDraft.bind(null, deck.id, source.id)}
        addAction={addRemainingCardDrafts.bind(null, deck.id, source.id)}
        source={source}
      />
    </main>
  );
}
