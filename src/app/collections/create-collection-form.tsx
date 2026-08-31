"use client";

import { useActionState } from "react";
import type { CreateCollectionFormState } from "@/interface/create-collection";

const initialState: CreateCollectionFormState = { status: "idle" };

type CreateCollectionAction = (
  state: CreateCollectionFormState,
  formData: FormData,
) => Promise<CreateCollectionFormState>;

export function CreateCollectionForm({
  action,
  collectionType,
}: {
  action: CreateCollectionAction;
  collectionType: "Flashcard Deck" | "Quiz";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const invalidState = state.status === "invalid" ? state : undefined;

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <div>
        <label className="block text-sm font-semibold text-slate-900" htmlFor="name">
          {collectionType} name
        </label>
        <input
          aria-describedby={invalidState?.fieldErrors.name ? "name-error" : undefined}
          aria-invalid={Boolean(invalidState?.fieldErrors.name)}
          autoComplete="off"
          className="mt-3 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          defaultValue={invalidState?.values.name}
          id="name"
          name="name"
        />
        {invalidState?.fieldErrors.name ? (
          <p
            className="mt-2 text-sm font-medium text-red-700"
            id="name-error"
            role="alert"
          >
            {invalidState.fieldErrors.name}
          </p>
        ) : null}
      </div>
      <button
        className="min-h-12 w-full rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-wait disabled:bg-slate-400 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating…" : `Create ${collectionType}`}
      </button>
    </form>
  );
}
