export type AnswerOptionContent = {
  id?: string;
  norwegian: string;
  english: string;
  isCorrect: boolean;
};

export type QuizQuestionContent = {
  promptNorwegian: string;
  promptEnglish: string;
  options: AnswerOptionContent[];
};

export type QuizQuestionInput = QuizQuestionContent & {
  imageUploadId?: string;
  removeImage?: boolean;
};

export type NewQuizQuestion = QuizQuestionInput & {
  quizId: string;
};

export type AnswerOption = Omit<AnswerOptionContent, "id"> & {
  id: string;
  position: number;
};

export type QuizQuestion = Omit<NewQuizQuestion, "options" | "imageUploadId" | "removeImage"> & {
  id: string;
  recallStreak: number;
  choiceType: "single" | "multiple";
  options: AnswerOption[];
  image?: import("./question-images").QuestionImage;
};

export type QuestionImageChange =
  | { kind: "keep" }
  | { kind: "attach"; uploadId: string }
  | { kind: "remove" };

export interface QuizQuestionRepository {
  create(question: QuizQuestion, imageUploadId?: string): Promise<QuizQuestion>;
  get(quizId: string, id: string): Promise<QuizQuestion | undefined>;
  list(quizId: string): Promise<QuizQuestion[]>;
  update(
    quizId: string,
    id: string,
    question: QuizQuestion,
    imageChange?: QuestionImageChange,
  ): Promise<QuizQuestion | undefined>;
  delete(quizId: string, id: string): Promise<boolean>;
}

export type QuizQuestionFieldErrors = {
  promptNorwegian?: string;
  promptEnglish?: string;
  options?: string;
  correctness?: string;
  image?: string;
  optionErrors?: Array<{ norwegian?: string; english?: string }>;
};

export class QuizQuestionValidationError extends Error {
  constructor(readonly fieldErrors: QuizQuestionFieldErrors) {
    super("Quiz Question content is invalid.");
    this.name = "QuizQuestionValidationError";
  }
}

export class QuizQuestionNotFoundError extends Error {
  constructor() {
    super("Quiz Question was not found.");
    this.name = "QuizQuestionNotFoundError";
  }
}

function validateQuestion(input: QuizQuestionContent) {
  const fieldErrors: QuizQuestionFieldErrors = {};
  if (!input.promptNorwegian.trim()) {
    fieldErrors.promptNorwegian = "Enter a Norwegian prompt.";
  }
  if (!input.promptEnglish.trim()) {
    fieldErrors.promptEnglish = "Enter its English translation.";
  }
  if (input.options.length < 2) {
    fieldErrors.options = "Add at least two Answer Options.";
  }
  if (!input.options.some(({ isCorrect }) => isCorrect)) {
    fieldErrors.correctness = "Mark at least one Answer Option as correct.";
  }

  const optionErrors = input.options.map((option) => ({
    ...(!option.norwegian.trim()
      ? { norwegian: "Enter the Norwegian option." }
      : {}),
    ...(!option.english.trim()
      ? { english: "Enter the English option." }
      : {}),
  }));
  if (optionErrors.some((errors) => Object.keys(errors).length > 0)) {
    fieldErrors.optionErrors = optionErrors;
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new QuizQuestionValidationError(fieldErrors);
  }
}

function prepareQuestion(
  input: NewQuizQuestion,
  existing?: Pick<QuizQuestion, "id" | "recallStreak" | "image">,
): QuizQuestion {
  const options = input.options.map((option, position) => ({
    id: option.id ?? crypto.randomUUID(),
    norwegian: option.norwegian,
    english: option.english,
    isCorrect: option.isCorrect,
    position,
  }));

  return {
    id: existing?.id ?? crypto.randomUUID(),
    quizId: input.quizId,
    promptNorwegian: input.promptNorwegian,
    promptEnglish: input.promptEnglish,
    recallStreak: existing?.recallStreak ?? 0,
    choiceType: options.filter(({ isCorrect }) => isCorrect).length === 1
      ? "single"
      : "multiple",
    options,
    ...(existing?.image ? { image: existing.image } : {}),
  };
}

export function createQuizQuestionService(
  repository: QuizQuestionRepository,
  cleanupImages: () => Promise<unknown> = async () => undefined,
) {
  return {
    async create(input: NewQuizQuestion) {
      validateQuestion(input);
      return repository.create(prepareQuestion(input), input.imageUploadId);
    },
    get(quizId: string, id: string) {
      return repository.get(quizId, id);
    },
    list(quizId: string) {
      return repository.list(quizId);
    },
    async update(
      quizId: string,
      id: string,
      input: QuizQuestionInput,
    ) {
      validateQuestion(input);
      const existing = await repository.get(quizId, id);
      if (!existing) throw new QuizQuestionNotFoundError();
      const imageChange: QuestionImageChange = input.imageUploadId
        ? { kind: "attach", uploadId: input.imageUploadId }
        : input.removeImage
          ? { kind: "remove" }
          : { kind: "keep" };
      const updated = await repository.update(
        quizId,
        id,
        prepareQuestion({ quizId, ...input }, existing),
        imageChange,
      );
      if (!updated) throw new QuizQuestionNotFoundError();
      if (imageChange.kind !== "keep") {
        try {
          await cleanupImages();
        } catch {
          // The committed Question change is authoritative; queued cleanup retries later.
        }
      }
      return updated;
    },
    async delete(quizId: string, id: string) {
      const deleted = await repository.delete(quizId, id);
      if (!deleted) throw new QuizQuestionNotFoundError();
      try {
        await cleanupImages();
      } catch {
        // The committed deletion is authoritative; queued cleanup retries later.
      }
    },
  };
}
