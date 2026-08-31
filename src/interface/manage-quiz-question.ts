import {
  QuizQuestionNotFoundError,
  QuizQuestionValidationError,
  type QuizQuestion,
  type QuizQuestionFieldErrors,
  type QuizQuestionInput,
  validateQuizQuestion,
  type createQuizQuestionService,
} from "../application/quiz-questions";
import type { createQuestionTranslationService } from "../application/question-translation";
import { QuestionImageValidationError } from "../application/question-images";

type QuizQuestionService = ReturnType<typeof createQuizQuestionService>;
type QuestionTranslationService = ReturnType<
  typeof createQuestionTranslationService
>;
export type QuizQuestionSaveIntent = "save" | "save-and-add-another";

export type QuizQuestionFormState =
  | { status: "idle" }
  | {
      status: "invalid";
      fieldErrors: QuizQuestionFieldErrors;
      values: QuizQuestionInput;
    }
  | {
      status: "translated";
      translatedCount: number;
      translationReviewKey: string;
      values: QuizQuestionInput;
    }
  | {
      status: "translation-failed";
      message: string;
      translationReviewKey: string;
      values: QuizQuestionInput;
    }
  | { status: "ready" }
  | { status: "saved"; intent: QuizQuestionSaveIntent };

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function readContent(formData: FormData): QuizQuestionInput {
  const optionIndexes = [...formData.keys()]
    .flatMap((key) => {
      const match = /^options\.(\d+)\./u.exec(key);
      return match ? [Number(match[1])] : [];
    })
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((a, b) => a - b);
  const correctOptions = new Set(
    formData.getAll("correctOptions").filter(
      (value): value is string => typeof value === "string",
    ),
  );
  const imageUploadId = textValue(formData, "imageUploadId");
  return {
    promptNorwegian: textValue(formData, "promptNorwegian"),
    promptEnglish: textValue(formData, "promptEnglish"),
    options: optionIndexes.map((index) => {
      const id = textValue(formData, `options.${index}.id`);
      return {
        ...(id ? { id } : {}),
        norwegian: textValue(formData, `options.${index}.norwegian`),
        english: textValue(formData, `options.${index}.english`),
        isCorrect: correctOptions.has(String(index)),
      };
    }),
    ...(imageUploadId ? { imageUploadId } : {}),
    ...(textValue(formData, "removeImage") === "true"
      ? { removeImage: true }
      : {}),
  };
}

function hasNorwegianChanges(
  existing: QuizQuestion,
  values: QuizQuestionInput,
) {
  if (values.promptNorwegian.trim() !== existing.promptNorwegian.trim()) {
    return true;
  }
  return values.options.some((option) => {
    const existingOption = option.id
      ? existing.options.find(({ id }) => id === option.id)
      : undefined;
    return !existingOption ||
      option.norwegian.trim() !== existingOption.norwegian.trim();
  });
}

function norwegianReviewKey(values: QuizQuestionInput) {
  return JSON.stringify({
    prompt: values.promptNorwegian.trim(),
    options: values.options.map((option) => ({
      id: option.id ?? null,
      norwegian: option.norwegian.trim(),
    })),
  });
}

export async function translateQuizQuestionForm(
  translations: QuestionTranslationService,
  existing: QuizQuestion | undefined,
  formData: FormData,
): Promise<QuizQuestionFormState> {
  const values = readContent(formData);
  const norwegianFieldErrors: QuizQuestionFieldErrors = {};
  if (!values.promptNorwegian.trim()) {
    norwegianFieldErrors.promptNorwegian = "Enter a Norwegian prompt.";
  }
  const optionErrors = values.options.map((option) =>
    option.norwegian.trim()
      ? {}
      : { norwegian: "Enter the Norwegian option." },
  );
  if (optionErrors.some((errors) => Object.keys(errors).length > 0)) {
    norwegianFieldErrors.optionErrors = optionErrors;
  }
  if (Object.keys(norwegianFieldErrors).length > 0) {
    return {
      status: "invalid",
      fieldErrors: norwegianFieldErrors,
      values,
    };
  }
  const targets: Array<
    | { kind: "prompt"; norwegian: string }
    | { kind: "option"; norwegian: string; optionIndex: number }
  > = [];
  if (
    !existing ||
    values.promptNorwegian.trim() !== existing.promptNorwegian.trim()
  ) {
    targets.push({ kind: "prompt", norwegian: values.promptNorwegian });
  }
  values.options.forEach((option, optionIndex) => {
    const existingOption = option.id
      ? existing?.options.find(({ id }) => id === option.id)
      : undefined;
    if (
      !existingOption ||
      option.norwegian.trim() !== existingOption.norwegian.trim()
    ) {
      targets.push({ kind: "option", norwegian: option.norwegian, optionIndex });
    }
  });

  try {
    const englishValues = targets.length > 0
      ? await translations.translate(targets.map(({ norwegian }) => norwegian))
      : [];
    const translatedValues: QuizQuestionInput = {
      ...values,
      options: values.options.map((option) => ({ ...option })),
    };
    targets.forEach((target, index) => {
      if (target.kind === "prompt") {
        translatedValues.promptEnglish = englishValues[index];
      } else {
        translatedValues.options[target.optionIndex].english = englishValues[index];
      }
    });
    return {
      status: "translated",
      translatedCount: targets.length,
      translationReviewKey: norwegianReviewKey(translatedValues),
      values: translatedValues,
    };
  } catch {
    return {
      status: "translation-failed",
      message:
        "Automatic translation is unavailable. Enter or review the English text manually.",
      translationReviewKey: norwegianReviewKey(values),
      values,
    };
  }
}

export async function submitQuizQuestionForm(
  questions: Pick<QuizQuestionService, "create" | "update">,
  quizId: string,
  questionId: string | undefined,
  formData: FormData,
): Promise<QuizQuestionFormState> {
  const values = readContent(formData);
  const intent = textValue(formData, "intent") === "save-and-add-another"
    ? "save-and-add-another"
    : "save";

  try {
    if (questionId) {
      await questions.update(quizId, questionId, values);
    } else {
      await questions.create({ quizId, ...values });
    }
    return { status: "saved", intent };
  } catch (error) {
    if (error instanceof QuizQuestionValidationError) {
      return { status: "invalid", fieldErrors: error.fieldErrors, values };
    }
    if (error instanceof QuestionImageValidationError) {
      return {
        status: "invalid",
        fieldErrors: { image: error.message },
        values,
      };
    }
    throw error;
  }
}

function validateQuizQuestionForm(formData: FormData): QuizQuestionFormState {
  const values = readContent(formData);
  try {
    validateQuizQuestion(values);
    return { status: "ready" };
  } catch (error) {
    if (error instanceof QuizQuestionValidationError) {
      return { status: "invalid", fieldErrors: error.fieldErrors, values };
    }
    throw error;
  }
}

export async function manageQuizQuestionForm(
  questions: Pick<QuizQuestionService, "create" | "get" | "update">,
  translations: QuestionTranslationService,
  quizId: string,
  questionId: string | undefined,
  formData: FormData,
): Promise<QuizQuestionFormState> {
  const existing = questionId
    ? await questions.get(quizId, questionId)
    : undefined;
  if (questionId && !existing) throw new QuizQuestionNotFoundError();
  if (textValue(formData, "intent") === "translate") {
    return translateQuizQuestionForm(translations, existing, formData);
  }
  const values = readContent(formData);
  if (
    existing &&
    hasNorwegianChanges(existing, values) &&
    textValue(formData, "translationReviewKey") !== norwegianReviewKey(values)
  ) {
    return translateQuizQuestionForm(translations, existing, formData);
  }
  if (textValue(formData, "intent") === "prepare-save") {
    return validateQuizQuestionForm(formData);
  }
  return submitQuizQuestionForm(
    questions,
    quizId,
    questionId,
    formData,
  );
}
