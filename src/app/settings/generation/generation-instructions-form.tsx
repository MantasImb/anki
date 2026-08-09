"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import type { GenerationInstructionsFormState } from "@/interface/manage-generation-instructions";

type SaveAction = (
  state: GenerationInstructionsFormState,
  formData: FormData,
) => Promise<GenerationInstructionsFormState>;

export function GenerationInstructionsForm({
  initialInstructions,
  saveAction,
  resetAction,
}: {
  initialInstructions: string;
  saveAction: SaveAction;
  resetAction: () => Promise<void>;
}) {
  const router = useRouter();
  const [resetPending, startReset] = useTransition();
  const [state, formAction, savePending] = useActionState(saveAction, {
    status: "idle",
    values: { instructions: initialInstructions },
  });
  const pending = savePending || resetPending;
  const invalidState = state.status === "invalid" ? state : undefined;

  return (
    <form action={formAction} aria-busy={pending} className="mt-8 space-y-6">
      {state.status === "saved" ? (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          role="status"
        >
          Generation Instructions saved.
        </p>
      ) : null}

      <div>
        <label
          className="block text-sm font-semibold text-slate-900"
          htmlFor="instructions"
        >
          Generation Instructions
        </label>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          These instructions are used for every future generation attempt.
        </p>
        <textarea
          aria-describedby={invalidState ? "instructions-error" : undefined}
          aria-invalid={Boolean(invalidState)}
          className="mt-3 min-h-80 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 shadow-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          defaultValue={state.values.instructions}
          id="instructions"
          key={`${initialInstructions}-${state.status}`}
          name="instructions"
          rows={14}
        />
        {invalidState ? (
          <p className="mt-2 text-sm font-medium text-red-700" id="instructions-error">
            {invalidState.fieldErrors.instructions}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="min-h-12 rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-wait disabled:bg-slate-400"
          disabled={pending}
          type="submit"
        >
          {savePending ? "Saving…" : "Save Instructions"}
        </button>
        <button
          className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-wait disabled:text-slate-400"
          disabled={pending}
          onClick={() =>
            startReset(async () => {
              await resetAction();
              router.refresh();
            })
          }
          type="button"
        >
          {resetPending ? "Restoring…" : "Restore Default"}
        </button>
      </div>
    </form>
  );
}
