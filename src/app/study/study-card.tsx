"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { Flashcard } from "@/application/flashcards";

type StudyAction = (formData: FormData) => Promise<void>;

function AssessmentButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        className="min-h-14 rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-base font-semibold text-red-800 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        name="assessment"
        type="submit"
        value="incorrect"
      >
        Incorrect
      </button>
      <button
        className="min-h-14 rounded-xl bg-emerald-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:bg-slate-400"
        disabled={pending}
        name="assessment"
        type="submit"
        value="correct"
      >
        Correct
      </button>
    </div>
  );
}

export function StudyCard({
  action,
  attemptId,
  flashcard,
}: {
  action: StudyAction;
  attemptId: string;
  flashcard: Flashcard;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
        Norwegian Front
      </p>
      <p className="mt-4 text-2xl font-semibold leading-9 text-slate-950 sm:text-3xl sm:leading-10">
        {flashcard.front}
      </p>

      {revealed ? (
        <div className="mt-8 border-t border-slate-200 pt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            English Back
          </p>
          <p className="mt-3 text-xl leading-8 text-slate-800">
            {flashcard.back}
          </p>
          <p className="mt-8 text-center text-sm font-medium text-slate-600">
            How well did you remember it?
          </p>
          <form action={action} className="mt-4">
            <input name="attemptId" type="hidden" value={attemptId} />
            <input name="flashcardId" type="hidden" value={flashcard.id} />
            <AssessmentButtons />
          </form>
        </div>
      ) : (
        <button
          className="mt-10 min-h-14 w-full rounded-xl bg-sky-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-sky-800"
          onClick={() => setRevealed(true)}
          type="button"
        >
          Reveal English Back
        </button>
      )}
    </section>
  );
}
