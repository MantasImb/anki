import type {
  createQuizStudyService,
  RecordQuizResult,
} from "../application/quiz-study";

type QuizStudyService = ReturnType<typeof createQuizStudyService>;

export class QuizAnswerSubmissionError extends Error {
  constructor() {
    super("The Quiz answer could not be recorded.");
    this.name = "QuizAnswerSubmissionError";
  }
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export async function submitQuizAnswer(
  study: Pick<QuizStudyService, "recordResult">,
  quizId: string,
  formData: FormData,
) {
  const translationHelp = formData.get("translationHelpUsed");
  const selectedOptionIds = formData.getAll("selectedOptionIds").filter(
    (value): value is string => typeof value === "string",
  );
  const input: RecordQuizResult = {
    id: formData.get("attemptId") as string,
    quizId,
    questionId: formData.get("questionId") as string,
    selectedOptionIds,
    translationHelpUsed: translationHelp === "true",
  };

  if (
    !isUuid(input.id) ||
    !isUuid(input.quizId) ||
    !isUuid(input.questionId) ||
    input.selectedOptionIds.length === 0 ||
    input.selectedOptionIds.some((id) => !isUuid(id)) ||
    (translationHelp !== "true" && translationHelp !== "false")
  ) {
    throw new QuizAnswerSubmissionError();
  }

  const recorded = await study.recordResult(input);
  return {
    questionId: recorded.questionId,
    outcome: recorded.outcome,
    translationHelpUsed: recorded.translationHelpUsed,
    recallStreak: recorded.recallStreak,
    correctOptionIds: recorded.correctOptionIds,
  };
}
