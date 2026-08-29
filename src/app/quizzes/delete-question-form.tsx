"use client";

import { useActionState } from "react";

export type DeleteQuestionFormState =
  | { status: "idle" }
  | { status: "failed"; message: string };

export function DeleteQuestionForm({
  action,
}: {
  action: (
    state: DeleteQuestionFormState,
    formData: FormData,
  ) => Promise<DeleteQuestionFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  return (
    <form
      action={formAction}
      className="mt-5"
      onSubmit={(event) => {
        if (!window.confirm("Delete this Question permanently?")) {
          event.preventDefault();
        }
      }}
    >
      {state.status === "failed" ? (
        <p className="mb-3 text-sm font-medium text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
      <button
        className="min-h-12 w-full rounded-xl border border-red-300 bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:text-slate-500 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? "Deleting…" : "Delete Question"}
      </button>
    </form>
  );
}
