"use client";

import { useActionState } from "react";
import type { GenerationFormState } from "@/interface/generate-card-drafts";

const initialState: GenerationFormState = { status: "idle" };

type GenerationAction = (
  state: GenerationFormState,
  formData: FormData,
) => Promise<GenerationFormState>;

export function GenerationForm({
  action,
  maximumCharacters,
}: {
  action: GenerationAction;
  maximumCharacters: number;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const invalidState = state.status === "invalid" ? state : undefined;

  return (
    <form
      action={formAction}
      aria-busy={pending}
      className="mt-8 space-y-6"
      noValidate
    >
      {invalidState ? (
        <div
          aria-atomic="true"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          role="alert"
        >
          Card Drafts were not generated. Check the Source Text and try again.
        </div>
      ) : null}

      <div>
        <label
          className="block text-sm font-semibold text-slate-900"
          htmlFor="sourceText"
        >
          Norwegian Source Text
        </label>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Paste one chapter or curriculum unit. The generated suggestions will
          remain drafts until you review them.
        </p>
        <textarea
          aria-describedby={
            invalidState?.fieldErrors.sourceText
              ? "source-text-help source-text-error"
              : "source-text-help"
          }
          aria-invalid={Boolean(invalidState?.fieldErrors.sourceText)}
          className="mt-3 min-h-72 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 shadow-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          defaultValue={invalidState?.values.sourceText}
          id="sourceText"
          maxLength={maximumCharacters}
          name="sourceText"
          rows={12}
        />
        <p className="mt-2 text-sm text-slate-500" id="source-text-help">
          Maximum {maximumCharacters.toLocaleString("en-US")} characters.
        </p>
        {invalidState?.fieldErrors.sourceText ? (
          <p
            className="mt-2 text-sm font-medium text-red-700"
            id="source-text-error"
          >
            {invalidState.fieldErrors.sourceText}
          </p>
        ) : null}
      </div>

      <button
        className="min-h-12 w-full rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white transition hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:cursor-wait disabled:bg-slate-400 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? "Generating Card Drafts…" : "Generate Card Drafts"}
      </button>
    </form>
  );
}
