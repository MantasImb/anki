"use client";

import { useRef, useState, useActionState } from "react";
import type { QuizQuestion } from "@/application/quiz-questions";
import type { QuizQuestionFormState } from "@/interface/manage-quiz-question";

const initialState: QuizQuestionFormState = { status: "idle" };

type QuestionFormAction = (
  state: QuizQuestionFormState,
  formData: FormData,
) => Promise<QuizQuestionFormState>;

type EditableOption = {
  key: string;
  id?: string;
  norwegian: string;
  english: string;
  isCorrect: boolean;
};

export function QuestionForm({
  action,
  question,
}: {
  action: QuestionFormAction;
  question?: QuizQuestion;
}) {
  const nextKey = useRef(question?.options.length ?? 2);
  const [promptNorwegian, setPromptNorwegian] = useState(
    question?.promptNorwegian ?? "",
  );
  const [promptEnglish, setPromptEnglish] = useState(
    question?.promptEnglish ?? "",
  );
  const [options, setOptions] = useState<EditableOption[]>(
    question?.options.map((option, index) => ({
      ...option,
      key: `existing-${index}`,
    })) ?? [
      { key: "initial-0", norwegian: "", english: "", isCorrect: true },
      { key: "initial-1", norwegian: "", english: "", isCorrect: false },
    ],
  );
  async function applyAction(
    previousState: QuizQuestionFormState,
    formData: FormData,
  ) {
    const nextState = await action(previousState, formData);
    if (
      nextState.status !== "translated" &&
      nextState.status !== "translation-failed"
    ) {
      return nextState;
    }
    setPromptNorwegian(nextState.values.promptNorwegian);
    setPromptEnglish(nextState.values.promptEnglish);
    setOptions((current) =>
      nextState.values.options.map((option, index) => ({
        ...option,
        key:
          current.find((candidate) =>
            option.id ? candidate.id === option.id : false,
          )?.key ?? current[index]?.key ?? `returned-${nextKey.current++}`,
      })),
    );
    return nextState;
  }
  const [state, formAction, pending] = useActionState(
    applyAction,
    initialState,
  );
  const invalidState = state.status === "invalid" ? state : undefined;

  function changeOption(index: number, patch: Partial<EditableOption>) {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    );
  }

  function moveOption(index: number, direction: -1 | 1) {
    setOptions((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  }

  function removeOption(index: number) {
    setOptions((current) => {
      const remaining = current.filter(
        (_, optionIndex) => optionIndex !== index,
      );
      if (remaining.some(({ isCorrect }) => isCorrect)) return remaining;
      return remaining.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === 0,
      }));
    });
  }

  return (
    <form action={formAction} className="mt-8 space-y-7" noValidate>
      {invalidState ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
          Question was not saved. Check the highlighted fields and try again.
        </div>
      ) : null}
      {state.status === "translated" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
          {state.translatedCount > 0
            ? "English is ready to review. Edit it as needed before saving."
            : "English is already up to date."}
        </div>
      ) : null}
      {state.status === "translation-failed" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" role="alert">
          {state.message}
        </div>
      ) : null}

      <TextArea
        error={invalidState?.fieldErrors.promptNorwegian}
        id="promptNorwegian"
        label="Norwegian prompt"
        name="promptNorwegian"
        onChange={setPromptNorwegian}
        value={promptNorwegian}
      />
      <TextArea
        error={invalidState?.fieldErrors.promptEnglish}
        id="promptEnglish"
        label="English prompt translation"
        name="promptEnglish"
        onChange={setPromptEnglish}
        value={promptEnglish}
      />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-slate-950">Answer Options</legend>
        <p className="text-sm text-slate-600">
          Add Norwegian and English text, then mark the one correct option.
        </p>
        {invalidState?.fieldErrors.options ? (
          <p className="text-sm font-medium text-red-700">{invalidState.fieldErrors.options}</p>
        ) : null}
        {invalidState?.fieldErrors.correctness ? (
          <p className="text-sm font-medium text-red-700">{invalidState.fieldErrors.correctness}</p>
        ) : null}

        {options.map((option, index) => {
          const errors = invalidState?.fieldErrors.optionErrors?.[index];
          const headingId = `option-${option.key}-heading`;
          return (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={option.key}>
              {option.id ? (
                <input name={`options.${index}.id`} type="hidden" value={option.id} />
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-950" id={headingId}>Option {index + 1}</h2>
                <div className="flex flex-wrap justify-end gap-2">
                  <button aria-describedby={headingId} disabled={index === 0} onClick={() => moveOption(index, -1)} type="button">Move up</button>
                  <button aria-describedby={headingId} disabled={index === options.length - 1} onClick={() => moveOption(index, 1)} type="button">Move down</button>
                  <button
                    aria-describedby={headingId}
                    disabled={options.length <= 2}
                    onClick={() => removeOption(index)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <label className="mt-4 block text-sm font-semibold text-slate-900" htmlFor={`option-${option.key}-norwegian`}>
                Norwegian option {index + 1}
              </label>
              <input
                aria-invalid={Boolean(errors?.norwegian)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3"
                id={`option-${option.key}-norwegian`}
                name={`options.${index}.norwegian`}
                onChange={(event) => changeOption(index, { norwegian: event.target.value })}
                value={option.norwegian}
              />
              {errors?.norwegian ? <p className="mt-2 text-sm text-red-700">{errors.norwegian}</p> : null}
              <label className="mt-4 block text-sm font-semibold text-slate-900" htmlFor={`option-${option.key}-english`}>
                English option {index + 1}
              </label>
              <input
                aria-invalid={Boolean(errors?.english)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3"
                id={`option-${option.key}-english`}
                name={`options.${index}.english`}
                onChange={(event) => changeOption(index, { english: event.target.value })}
                value={option.english}
              />
              {errors?.english ? <p className="mt-2 text-sm text-red-700">{errors.english}</p> : null}
              <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-900">
                <input
                  checked={option.isCorrect}
                  name="correctOption"
                  onChange={() => setOptions((current) => current.map((candidate, candidateIndex) => ({ ...candidate, isCorrect: candidateIndex === index })))}
                  type="radio"
                  value={index}
                />
                Correct option {index + 1}
              </label>
            </section>
          );
        })}
      </fieldset>

      <button
        className="min-h-12 rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 font-semibold text-sky-800"
        onClick={() => {
          const key = nextKey.current++;
          setOptions((current) => [...current, { key: `added-${key}`, norwegian: "", english: "", isCorrect: false }]);
        }}
        type="button"
      >
        Add option
      </button>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="min-h-12 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 font-semibold text-emerald-900 disabled:text-slate-400" disabled={pending} name="intent" type="submit" value="translate">
          {pending ? "Working…" : "Translate to English"}
        </button>
        <button className="min-h-12 rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white disabled:bg-slate-400" disabled={pending} name="intent" type="submit" value="save">
          {pending ? "Saving…" : "Save Question"}
        </button>
        {!question ? (
          <button className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 disabled:text-slate-400" disabled={pending} name="intent" type="submit" value="save-and-add-another">
            Save and add another
          </button>
        ) : null}
      </div>
    </form>
  );
}

function TextArea({
  error,
  id,
  label,
  name,
  onChange,
  value,
}: {
  error?: string;
  id: string;
  label: string;
  name: string;
  onChange(value: string): void;
  value: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900" htmlFor={id}>{label}</label>
      <textarea
        aria-invalid={Boolean(error)}
        className="mt-3 min-h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        id={id}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        value={value}
      />
      {error ? <p className="mt-2 text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
