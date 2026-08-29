"use client";

import { useRef, useState, useActionState } from "react";
import type { QuizQuestion } from "@/application/quiz-questions";
import {
  QUESTION_IMAGE_CONTENT_TYPES,
  QUESTION_IMAGE_MAXIMUM_BYTES,
  QUESTION_IMAGE_WARNING_BYTES,
} from "@/application/question-images";
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
  imageUrl,
  question,
}: {
  action: QuestionFormAction;
  imageUrl?: string;
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
  const [selectedImage, setSelectedImage] = useState<File>();
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState<string>();
  const [uploadingImage, setUploadingImage] = useState(false);

  async function responseJson(response: Response) {
    const body = await response.json() as { message?: string; uploadId?: string; uploadUrl?: string };
    if (!response.ok) throw new Error(body.message || "Question Image upload failed.");
    return body;
  }

  async function uploadImage(file: File) {
    const authorization = await responseJson(await fetch(
      "/api/question-images/authorize",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalName: file.name,
          contentType: file.type,
          byteSize: file.size,
        }),
      },
    ));
    if (!authorization.uploadId || !authorization.uploadUrl) {
      throw new Error("Question Image upload authorization was incomplete.");
    }
    const uploaded = await fetch(authorization.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploaded.ok) throw new Error("Question Image could not be uploaded.");
    await responseJson(await fetch("/api/question-images/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId: authorization.uploadId }),
    }));
    return authorization.uploadId;
  }

  async function applyAction(
    previousState: QuizQuestionFormState,
    formData: FormData,
  ) {
    setImageError(undefined);
    if (formData.get("intent") !== "translate") {
      try {
        if (selectedImage) {
          setUploadingImage(true);
          formData.set("imageUploadId", await uploadImage(selectedImage));
          formData.delete("removeImage");
        } else if (removeImage) {
          formData.set("removeImage", "true");
        }
      } catch (error) {
        setImageError(
          error instanceof Error ? error.message : "Question Image upload failed.",
        );
        return previousState;
      } finally {
        setUploadingImage(false);
      }
    }
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Question Image</h2>
        <p className="mt-1 text-sm text-slate-600">
          Optional. Choose one JPEG, PNG, WebP, or GIF, up to 25 MB.
        </p>
        {question?.image && imageUrl && !removeImage && !selectedImage ? (
          <div className="mt-4">
            {/* Direct rendering preserves browser-supported animated GIF behavior. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Current Question Image"
              className="max-h-80 w-full rounded-xl object-contain"
              src={imageUrl}
            />
            <p className="mt-2 text-sm text-slate-600">
              {question.image.originalName} · {formatFileSize(question.image.byteSize)}
            </p>
            <button
              className="mt-3 min-h-11 rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-800"
              onClick={() => setRemoveImage(true)}
              type="button"
            >
              Remove image
            </button>
          </div>
        ) : null}
        {removeImage && !selectedImage ? (
          <p className="mt-3 text-sm font-medium text-slate-700">
            The current image will be removed when you save.
          </p>
        ) : null}
        <label className="mt-4 block text-sm font-semibold text-slate-900" htmlFor="questionImage">
          Question Image
        </label>
        <input
          accept={QUESTION_IMAGE_CONTENT_TYPES.join(",")}
          className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2"
          id="questionImage"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setImageError(undefined);
            if (!file) {
              setSelectedImage(undefined);
              return;
            }
            if (!QUESTION_IMAGE_CONTENT_TYPES.includes(
              file.type as (typeof QUESTION_IMAGE_CONTENT_TYPES)[number],
            )) {
              setSelectedImage(undefined);
              setImageError("Choose a JPEG, PNG, WebP, or GIF image.");
              return;
            }
            if (file.size > QUESTION_IMAGE_MAXIMUM_BYTES) {
              setSelectedImage(undefined);
              setImageError("Question Images must be 25 MB or smaller.");
              return;
            }
            setSelectedImage(file);
          }}
          type="file"
        />
        {selectedImage ? (
          <p className="mt-2 text-sm text-slate-700">
            {selectedImage.name} · {formatFileSize(selectedImage.size)}
          </p>
        ) : null}
        {selectedImage && selectedImage.size > QUESTION_IMAGE_WARNING_BYTES ? (
          <p className="mt-2 text-sm font-medium text-amber-800">
            This image is larger than 5 MB and may take longer to upload.
          </p>
        ) : null}
        {imageError ? <p className="mt-2 text-sm font-medium text-red-700" role="alert">{imageError}</p> : null}
        {invalidState?.fieldErrors.image ? (
          <p className="mt-2 text-sm font-medium text-red-700">{invalidState.fieldErrors.image}</p>
        ) : null}
      </section>
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
          Add Norwegian and English text, then mark every correct option.
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
                  name="correctOptions"
                  onChange={(event) => changeOption(index, { isCorrect: event.target.checked })}
                  type="checkbox"
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
        <button className="min-h-12 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 font-semibold text-emerald-900 disabled:text-slate-400" disabled={pending || uploadingImage} name="intent" type="submit" value="translate">
          {pending ? "Working…" : "Translate to English"}
        </button>
        <button className="min-h-12 rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white disabled:bg-slate-400" disabled={pending || uploadingImage} name="intent" type="submit" value="save">
          {uploadingImage ? "Uploading image…" : pending ? "Saving…" : "Save Question"}
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

function formatFileSize(byteSize: number) {
  if (byteSize >= 1024 * 1024) return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;
  if (byteSize >= 1024) return `${(byteSize / 1024).toFixed(1)} KB`;
  return `${byteSize} bytes`;
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
