"use client";

import { useActionState } from "react";

export type DeleteCollectionFormState =
  | { status: "idle" }
  | { status: "failed"; message: string };

export function DeleteCollectionForm({
  action,
  collectionType,
  itemCount,
  itemName,
}: {
  action: (
    state: DeleteCollectionFormState,
    formData: FormData,
  ) => Promise<DeleteCollectionFormState>;
  collectionType: "Flashcard Deck" | "Quiz";
  itemCount: number;
  itemName: "Flashcard" | "Question";
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const itemLabel = `${itemName}${itemCount === 1 ? "" : "s"}`;

  return (
    <form
      action={formAction}
      className="mt-5"
      onSubmit={(event) => {
        if (!window.confirm(
          `Delete this ${collectionType} and its ${itemCount} active ${itemLabel} permanently?`,
        )) {
          event.preventDefault();
        }
      }}
    >
      <p className="text-sm text-slate-600">
        This {collectionType} contains {itemCount} active {itemLabel}.
      </p>
      {state.status === "failed" ? (
        <p className="mt-3 text-sm font-medium text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
      <button
        className="mt-4 min-h-12 w-full rounded-xl border border-red-300 bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:text-slate-500 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? "Deleting…" : `Delete ${collectionType}`}
      </button>
    </form>
  );
}
