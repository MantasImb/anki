"use client";

import { useActionState } from "react";
import type { RetryGenerationState } from "@/interface/retry-generation";

type RetryAction = (
  state: RetryGenerationState,
) => Promise<RetryGenerationState>;

const initialState: RetryGenerationState = { status: "idle" };

export function RetryGeneration({ action }: { action: RetryAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} aria-busy={pending} className="mt-6">
      {state.status === "failed" ? (
        <p
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          role="alert"
        >
          Card Drafts still could not be generated. You can try again.
        </p>
      ) : null}
      <button
        className="min-h-12 w-full rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-wait disabled:bg-slate-400 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? "Trying Again…" : "Try Again"}
      </button>
    </form>
  );
}
