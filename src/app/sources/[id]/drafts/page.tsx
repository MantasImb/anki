import Link from "next/link";
import { notFound } from "next/navigation";
import { getSourceWithDrafts } from "@/composition/generation";
import { DraftReview } from "./draft-review";
import { retryCardDraftGeneration } from "./actions";
import { RetryGeneration } from "./retry-generation";

export default async function SourceDraftsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await getSourceWithDrafts(id);

  if (!source) {
    notFound();
  }

  if (source.generationStatus === "failed") {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <Link
          className="text-sm font-semibold text-sky-700 hover:text-sky-900"
          href="/generate"
        >
          ← Back to generation
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
          Generation interrupted
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Card Drafts weren&apos;t generated
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Your Source Text is safely retained. Try again without pasting it a
          second time.
        </p>
        <RetryGeneration
          action={retryCardDraftGeneration.bind(null, source.id)}
        />
      </main>
    );
  }

  if (source.generationStatus !== "completed") {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-sky-700 hover:text-sky-900"
        href="/generate"
      >
        ← Generate from another Source Text
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Generation complete
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Review Card Drafts
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Your complete generated collection is saved and ready for review.
      </p>
      <DraftReview source={source} />
    </main>
  );
}
