import Link from "next/link";
import { notFound } from "next/navigation";
import { getSourceWithDrafts } from "@/composition/generation";
import { DraftReview } from "./draft-review";

export default async function SourceDraftsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await getSourceWithDrafts(id);

  if (!source || source.generationStatus !== "completed") {
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
