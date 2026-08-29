"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import {
  createQuizStudyScheduler,
  shuffleAnswerOptions,
  type QuizStudyQuestion,
} from "@/application/quiz-study";

export type QuizStudyAction = (formData: FormData) => Promise<{
  questionId: string | null;
  outcome: "correct" | "incorrect";
  translationHelpUsed: boolean;
  recallStreak: number;
  correctOptionId: string;
}>;

function createAttemptId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const hexadecimal = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  );
  hexadecimal[12] = "4";
  hexadecimal[16] = "8";
  return [
    hexadecimal.slice(0, 8).join(""),
    hexadecimal.slice(8, 12).join(""),
    hexadecimal.slice(12, 16).join(""),
    hexadecimal.slice(16, 20).join(""),
    hexadecimal.slice(20).join(""),
  ].join("-");
}

function createSeededRandom(seed: string) {
  let state = [...seed].reduce(
    (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619),
    2166136261,
  ) >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function QuizStudySession({
  action,
  initialAttemptId,
  initialQuestionId,
  questions: initialQuestions,
  random = Math.random,
}: {
  action: QuizStudyAction;
  initialAttemptId: string;
  initialQuestionId: string;
  questions: QuizStudyQuestion[];
  random?: () => number;
}) {
  const scheduler = useRef(createQuizStudyScheduler(random ?? Math.random));
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentQuestionId, setCurrentQuestionId] = useState(initialQuestionId);
  const [attemptId, setAttemptId] = useState(initialAttemptId);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [feedback, setFeedback] = useState<
    Awaited<ReturnType<QuizStudyAction>> | undefined
  >();
  const [error, setError] = useState<string>();
  const [translationHelpUsed, setTranslationHelpUsed] = useState(false);
  const question = questions.find(({ id }) => id === currentQuestionId);
  const options = useMemo(
    () => question
      ? shuffleAnswerOptions(
          question.options,
          random ?? createSeededRandom(attemptId),
        )
      : [],
    [attemptId, question, random],
  );

  const submit = async (formData: FormData) => {
    setError(undefined);
    try {
      setFeedback(await action(formData));
    } catch {
      setError("Could not record this answer. Try again.");
    }
  };
  const [, formAction, pending] = useActionState(
    async (_previous: null, formData: FormData) => {
      await submit(formData);
      return null;
    },
    null,
  );

  if (!question) return null;

  const advance = () => {
    if (!feedback) return;
    const updatedQuestions = questions.map((candidate) =>
      candidate.id === question.id
        ? { ...candidate, recallStreak: feedback.recallStreak }
        : candidate,
    );
    scheduler.current.recordResult(question.id, feedback.outcome);
    const next = scheduler.current.next(updatedQuestions, question.id);
    setQuestions(updatedQuestions);
    setCurrentQuestionId(next?.id ?? "");
    setAttemptId(createAttemptId());
    setSelectedOptionId("");
    setTranslationHelpUsed(false);
    setFeedback(undefined);
    setError(undefined);
  };

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      {translationHelpUsed ? (
        <div>
          <p className="text-2xl font-semibold leading-9 text-slate-950">
            {question.promptEnglish}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {question.promptNorwegian}
          </p>
        </div>
      ) : (
        <p className="text-2xl font-semibold leading-9 text-slate-950">
          {question.promptNorwegian}
        </p>
      )}
      {!feedback ? (
        <button
          className="mt-5 min-h-11 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 font-semibold text-sky-800"
          disabled={pending}
          onClick={() => setTranslationHelpUsed(true)}
          type="button"
        >
          Translation Help
        </button>
      ) : null}
      <form action={formAction}>
        <input name="attemptId" type="hidden" value={attemptId} />
        <input name="questionId" type="hidden" value={question.id} />
        <input
          name="translationHelpUsed"
          type="hidden"
          value={translationHelpUsed ? "true" : "false"}
        />
        <fieldset className="mt-7 space-y-3">
          <legend className="sr-only">Choose one Answer Option</legend>
          {options.map((option) => {
            const isCorrect = feedback?.correctOptionId === option.id;
            const isSelectedIncorrect = feedback && selectedOptionId === option.id && !isCorrect;
            return (
              <label
                className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                  isCorrect
                    ? "border-emerald-500 bg-emerald-50"
                    : isSelectedIncorrect
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200"
                }`}
                key={option.id}
              >
                <span className="flex items-center gap-3">
                  <input
                    checked={selectedOptionId === option.id}
                    disabled={Boolean(feedback) || pending}
                    name="selectedOptionId"
                    onChange={() => setSelectedOptionId(option.id)}
                    required
                    type="radio"
                    value={option.id}
                  />
                  {translationHelpUsed ? (
                    <span className="flex flex-col">
                      <span>{option.english}</span>
                      <span className="text-sm text-slate-500">
                        {option.norwegian}
                      </span>
                    </span>
                  ) : (
                    <span>{option.norwegian}</span>
                  )}
                </span>
                {isCorrect ? (
                  <span className="text-xs font-semibold text-emerald-800">
                    Correct answer
                  </span>
                ) : isSelectedIncorrect ? (
                  <span className="text-xs font-semibold text-red-800">
                    Your incorrect selection
                  </span>
                ) : null}
              </label>
            );
          })}
        </fieldset>

        {error ? <p className="mt-4 text-sm text-red-800" role="alert">{error}</p> : null}
        {feedback ? (
          <div className="mt-6" aria-live="polite">
            <p className={`font-semibold ${feedback.outcome === "correct" ? "text-emerald-800" : "text-red-800"}`}>
              {feedback.outcome === "correct" ? "Correct" : "Incorrect"}
            </p>
            {feedback.translationHelpUsed ? (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Translation Help used
              </p>
            ) : null}
            <button className="mt-4 min-h-12 w-full rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white" onClick={advance} type="button">
              Next Question
            </button>
          </div>
        ) : (
          <button
            className="mt-6 min-h-12 w-full rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white disabled:bg-slate-400"
            disabled={!selectedOptionId || pending}
            type="submit"
          >
            {pending ? "Submitting…" : "Submit answer"}
          </button>
        )}
      </form>
    </section>
  );
}
