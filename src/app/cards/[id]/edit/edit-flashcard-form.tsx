"use client";

import { useActionState } from "react";
import type { Flashcard } from "@/application/flashcards";
import type { EditFlashcardFormState } from "@/interface/maintain-flashcard";

type EditFlashcardAction = (
  state: EditFlashcardFormState,
  formData: FormData,
) => Promise<EditFlashcardFormState>;

export function EditFlashcardForm({
  action,
  flashcard,
}: {
  action: EditFlashcardAction;
  flashcard: Flashcard;
}) {
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
  });
  const invalidState = state.status === "invalid" ? state : undefined;

  return (
    <form action={formAction} className="mt-8 space-y-6" noValidate>
      {invalidState ? (
        <div
          aria-atomic="true"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          role="alert"
        >
          Flashcard was not updated. Check the highlighted fields and try
          again.
        </div>
      ) : null}

      <div>
        <label
          className="block text-sm font-semibold text-slate-900"
          htmlFor="front"
        >
          Norwegian Front
        </label>
        <p className="mt-1 text-sm text-slate-600">
          The Norwegian prompt shown while studying.
        </p>
        <textarea
          aria-describedby={
            invalidState?.fieldErrors.front ? "front-error" : undefined
          }
          aria-invalid={Boolean(invalidState?.fieldErrors.front)}
          className="mt-3 min-h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          defaultValue={invalidState?.values.front ?? flashcard.front}
          id="front"
          name="front"
          rows={4}
        />
        {invalidState?.fieldErrors.front ? (
          <p className="mt-2 text-sm font-medium text-red-700" id="front-error">
            {invalidState.fieldErrors.front}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="block text-sm font-semibold text-slate-900"
          htmlFor="back"
        >
          English Back
        </label>
        <p className="mt-1 text-sm text-slate-600">
          The English translation revealed after answering.
        </p>
        <textarea
          aria-describedby={
            invalidState?.fieldErrors.back ? "back-error" : undefined
          }
          aria-invalid={Boolean(invalidState?.fieldErrors.back)}
          className="mt-3 min-h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          defaultValue={invalidState?.values.back ?? flashcard.back}
          id="back"
          name="back"
          rows={4}
        />
        {invalidState?.fieldErrors.back ? (
          <p className="mt-2 text-sm font-medium text-red-700" id="back-error">
            {invalidState.fieldErrors.back}
          </p>
        ) : null}
      </div>

      <button
        className="min-h-12 w-full rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white disabled:cursor-wait disabled:bg-slate-400 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

export function DeleteFlashcardForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      className="mt-5"
      onSubmit={(event) => {
        if (!window.confirm("Delete this Flashcard permanently?")) {
          event.preventDefault();
        }
      }}
    >
      <button
        className="min-h-12 w-full rounded-xl border border-red-300 bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 sm:w-auto"
        type="submit"
      >
        Delete Flashcard
      </button>
    </form>
  );
}
