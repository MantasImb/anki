import {
  QuizQuestionNotFoundError,
  QuizQuestionValidationError,
  type QuizQuestion,
  type QuizQuestionContent,
  type QuizQuestionFieldErrors,
  type createQuizQuestionService,
} from "../application/quiz-questions";
import type { createQuestionTranslationService } from "../application/question-translation";

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
      values: QuizQuestionContent;
    }
  | {
      status: "translated";
      translatedCount: number;
      values: QuizQuestionContent;
    }
  | {
      status: "translation-failed";
      message: string;
      values: QuizQuestionContent;
    }
  | { status: "saved"; intent: QuizQuestionSaveIntent };

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function readContent(formData: FormData): QuizQuestionContent {
  const optionIndexes = [...formData.keys()]
    .flatMap((key) => {
      const match = /^options\.(\d+)\./u.exec(key);
      return match ? [Number(match[1])] : [];
    })
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((a, b) => a - b);
  const correctOption = textValue(formData, "correctOption");

  return {
    promptNorwegian: textValue(formData, "promptNorwegian"),
    promptEnglish: textValue(formData, "promptEnglish"),
    options: optionIndexes.map((index) => {
      const id = textValue(formData, `options.${index}.id`);
      return {
        ...(id ? { id } : {}),
        norwegian: textValue(formData, `options.${index}.norwegian`),
        english: textValue(formData, `options.${index}.english`),
        isCorrect: correctOption === String(index),
      };
    }),
  };
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
    const translatedValues: QuizQuestionContent = {
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
      values: translatedValues,
    };
  } catch {
    return {
      status: "translation-failed",
      message:
        "Automatic translation is unavailable. Enter or review the English text manually.",
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
  if (textValue(formData, "intent") === "translate") {
    const existing = questionId
      ? await questions.get(quizId, questionId)
      : undefined;
    if (questionId && !existing) throw new QuizQuestionNotFoundError();
    return translateQuizQuestionForm(translations, existing, formData);
  }
  return submitQuizQuestionForm(
    questions,
    quizId,
    questionId,
    formData,
  );
}
