import type { SourceWithDrafts } from "@/application/generation";

export function DraftReview({ source }: { source: SourceWithDrafts }) {
  return (
    <>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-slate-900">Source Text</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {source.content}
        </p>
      </div>

      <section className="mt-10" aria-labelledby="drafts-heading">
        <h2
          className="text-2xl font-semibold tracking-tight text-slate-950"
          id="drafts-heading"
        >
          {source.drafts.length} Card Drafts
        </h2>
        <p className="mt-2 leading-7 text-slate-600">
          These suggestions are not Flashcards yet. Editing and approval arrive
          in the next review phase.
        </p>

        <ol className="mt-6 space-y-4">
          {source.drafts.map((draft) => (
            <li
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              key={draft.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                  Pending review
                </p>
              </div>
              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-semibold text-slate-500">
                    Norwegian Front
                  </dt>
                  <dd className="mt-2 text-lg leading-7 text-slate-950">
                    {draft.front}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-slate-500">
                    English Back
                  </dt>
                  <dd className="mt-2 text-lg leading-7 text-slate-950">
                    {draft.back}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
