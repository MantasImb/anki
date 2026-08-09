"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { CardDraft, SourceWithDrafts } from "@/application/generation";
import type { CardDraftReviewFormState } from "@/interface/review-card-draft";

type ReviewAction = (
  state: CardDraftReviewFormState,
  formData: FormData,
) => Promise<CardDraftReviewFormState>;

type AddRemainingAction = (formData: FormData) => Promise<void>;

const initialState: CardDraftReviewFormState = { status: "idle" };

function DraftReviewCard({
  action,
  draft,
}: {
  action: ReviewAction;
  draft: CardDraft;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const invalidState = state.status === "invalid" ? state : undefined;
  const isPending = draft.reviewStatus === "pending";

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {isPending ? (
        <form action={formAction} className="space-y-4" noValidate>
          <input name="draftId" type="hidden" value={draft.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-slate-700"
                htmlFor={`${draft.id}-front`}
              >
                Norwegian Front
              </label>
              <textarea
                aria-describedby={
                  invalidState?.fieldErrors.front
                    ? `${draft.id}-front-error`
                    : undefined
                }
                aria-invalid={Boolean(invalidState?.fieldErrors.front)}
                className="content-sized-textarea mt-2 min-h-12 w-full resize-y rounded-xl border border-slate-300 px-4 py-2.5 text-base leading-6 text-slate-950 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                defaultValue={invalidState?.values.front ?? draft.front}
                id={`${draft.id}-front`}
                name="front"
                rows={1}
              />
              {invalidState?.fieldErrors.front ? (
                <p
                  className="mt-2 text-sm font-medium text-red-700"
                  id={`${draft.id}-front-error`}
                >
                  {invalidState.fieldErrors.front}
                </p>
              ) : null}
            </div>
            <div>
              <label
                className="text-sm font-semibold text-slate-700"
                htmlFor={`${draft.id}-back`}
              >
                English Back
              </label>
              <textarea
                aria-describedby={
                  invalidState?.fieldErrors.back
                    ? `${draft.id}-back-error`
                    : undefined
                }
                aria-invalid={Boolean(invalidState?.fieldErrors.back)}
                className="content-sized-textarea mt-2 min-h-12 w-full resize-y rounded-xl border border-slate-300 px-4 py-2.5 text-base leading-6 text-slate-950 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                defaultValue={invalidState?.values.back ?? draft.back}
                id={`${draft.id}-back`}
                name="back"
                rows={1}
              />
              {invalidState?.fieldErrors.back ? (
                <p
                  className="mt-2 text-sm font-medium text-red-700"
                  id={`${draft.id}-back-error`}
                >
                  {invalidState.fieldErrors.back}
                </p>
              ) : null}
            </div>
          </div>

          <p
            className={`rounded-lg px-3 py-2 text-sm font-medium text-slate-700 ${
              state.status === "idle" || state.status === "invalid"
                ? "sr-only"
                : "bg-slate-50"
            }`}
            role="status"
          >
            {state.status === "saved"
              ? "Card Draft edits saved."
              : state.status === "approved"
                ? "Card Draft approved."
                : state.status === "rejected"
                  ? "Card Draft removed."
                  : state.status === "unavailable"
                    ? "This Card Draft was already reviewed."
                    : ""}
          </p>

          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <button
              className="min-h-12 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
              disabled={pending}
              name="intent"
              type="submit"
              value="save"
            >
              Save edits
            </button>
            <button
              className="min-h-12 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
              disabled={pending}
              name="intent"
              type="submit"
              value="reject"
            >
              Remove
            </button>
          </div>
        </form>
      ) : (
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
      )}
    </li>
  );
}

function AddRemainingButton({ count }: { count: number }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="min-h-12 w-full rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:bg-slate-400 sm:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending
        ? "Adding Flashcards…"
        : `Add ${count} ${count === 1 ? "Flashcard" : "Flashcards"}`}
    </button>
  );
}

export function DraftReview({
  action,
  addAction,
  source,
}: {
  action: ReviewAction;
  addAction: AddRemainingAction;
  source: SourceWithDrafts;
}) {
  const pendingDrafts = source.drafts.filter(
    (draft) => draft.reviewStatus === "pending",
  );

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
          {pendingDrafts.length > 0
            ? `${pendingDrafts.length} Card ${pendingDrafts.length === 1 ? "Draft" : "Drafts"} ready to add`
            : "No Card Drafts remain"}
        </h2>
        <p className="mt-2 leading-7 text-slate-600">
          {pendingDrafts.length > 0
            ? "The generated cards are ready by default. Save any edits, remove the ones you do not want, then add everything that remains."
            : "Every generated draft from this Source Text has already been added or removed."}
        </p>

        <ol className="mt-6 space-y-4">
          {pendingDrafts.map((draft) => (
            <DraftReviewCard action={action} draft={draft} key={draft.id} />
          ))}
        </ol>

        {pendingDrafts.length > 0 ? (
          <form
            action={addAction}
            className="mt-8 border-t border-slate-200 pt-6"
          >
            <AddRemainingButton count={pendingDrafts.length} />
          </form>
        ) : (
          <p className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
            No Card Drafts remain to add.
          </p>
        )}
      </section>
    </>
  );
}
