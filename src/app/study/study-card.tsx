"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { calculateLearningProgress } from "@/application/learning-progress";
import type { Flashcard } from "@/application/flashcards";
import {
  createStudyScheduler,
  type StudyAssessment,
} from "@/application/study";

type StudyAction = (formData: FormData) => Promise<void>;
type StudySessionAction = (formData: FormData) => Promise<{
  flashcardId: string;
  recallStreak: number;
}>;

function createAttemptId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  const hexadecimal = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  );
  hexadecimal[12] = "4";
  hexadecimal[16] = ["8", "9", "a", "b"][
    Math.floor(Math.random() * 4)
  ];

  return [
    hexadecimal.slice(0, 8).join(""),
    hexadecimal.slice(8, 12).join(""),
    hexadecimal.slice(12, 16).join(""),
    hexadecimal.slice(16, 20).join(""),
    hexadecimal.slice(20).join(""),
  ].join("-");
}

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
  error,
  flashcard,
}: {
  action: StudyAction;
  attemptId: string;
  error?: string;
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
          {error ? (
            <p
              className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}
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

export function StudySession({
  action,
  cards: initialCards,
  children,
  initialAttemptId,
  initialCardId,
  random = Math.random,
}: {
  action: StudySessionAction;
  cards: Flashcard[];
  children?: ReactNode;
  initialAttemptId: string;
  initialCardId: string;
  random?: () => number;
}) {
  const scheduler = useRef(createStudyScheduler(random));
  const [cards, setCards] = useState(initialCards);
  const [currentCardId, setCurrentCardId] = useState(initialCardId);
  const [attemptId, setAttemptId] = useState(initialAttemptId);
  const [error, setError] = useState<string>();
  const [learnedCard, setLearnedCard] = useState<Flashcard>();
  useEffect(() => {
    if (!learnedCard) return;
    const timeout = setTimeout(() => setLearnedCard(undefined), 6000);
    return () => clearTimeout(timeout);
  }, [learnedCard]);
  const flashcard = cards.find(({ id }) => id === currentCardId);

  if (!flashcard) {
    return (
      <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-semibold text-slate-950">
          No eligible Flashcard right now
        </p>
      </section>
    );
  }

  const recordAndAdvance = async (formData: FormData) => {
    const assessment = formData.get("assessment") as StudyAssessment;
    setError(undefined);

    let recorded: Awaited<ReturnType<StudySessionAction>>;
    try {
      recorded = await action(formData);
    } catch {
      setError("Could not record this result. Try again.");
      return;
    }

    const updatedCards = cards.map((card) =>
      card.id === recorded.flashcardId
        ? { ...card, recallStreak: recorded.recallStreak }
        : card,
    );

    if (flashcard.recallStreak === 2 && recorded.recallStreak === 3) {
      setLearnedCard(flashcard);
    }

    scheduler.current.recordResult(recorded.flashcardId, assessment);
    const next = scheduler.current.next(updatedCards, recorded.flashcardId);

    setCards(updatedCards);
    setCurrentCardId(next?.id ?? "");
    setAttemptId(createAttemptId());
  };

  return (
    <>
      <p className="mt-2 text-sm text-slate-500">
        {calculateLearningProgress(cards).percentage}% Learned
      </p>
      {children}
      <div role="status" aria-atomic="true">
        {learnedCard ? (
          <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-2 rounded-xl border border-emerald-200 bg-white p-4 text-sm text-emerald-800 shadow-lg">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">Flashcard learned: {learnedCard.front}</p>
              <p className="mt-1">Answered correctly 3 times in a row. Now learned!</p>
            </div>
            <button
              aria-label="Dismiss learned flashcard notification"
              className="min-h-11 min-w-11 shrink-0 rounded-lg text-xl hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
              onClick={() => setLearnedCard(undefined)}
              type="button"
            >
              ×
            </button>
          </div>
        ) : null}
      </div>
      <div className={learnedCard ? "pb-40" : undefined}>
        <StudyCard
          action={recordAndAdvance}
          attemptId={attemptId}
          error={error}
          flashcard={flashcard}
          key={attemptId}
        />
      </div>
    </>
  );
}
