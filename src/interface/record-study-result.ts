import type {
  createStudyService,
  RecordDeckStudyResult,
  StudyAssessment,
} from "../application/study";

type StudyService = ReturnType<typeof createStudyService>;

export class StudyAssessmentSubmissionError extends Error {
  constructor() {
    super("The study assessment could not be recorded.");
    this.name = "StudyAssessmentSubmissionError";
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

function isAssessment(value: unknown): value is StudyAssessment {
  return value === "correct" || value === "incorrect";
}

export async function submitStudyAssessment(
  study: Pick<StudyService, "recordResult">,
  deckId: string,
  formData: FormData,
) {
  const input: RecordDeckStudyResult = {
    id: formData.get("attemptId") as string,
    deckId,
    flashcardId: formData.get("flashcardId") as string,
    assessment: formData.get("assessment") as StudyAssessment,
  };

  if (
    !isUuid(input.id) ||
    !isUuid(input.deckId) ||
    !isUuid(input.flashcardId) ||
    !isAssessment(input.assessment)
  ) {
    throw new StudyAssessmentSubmissionError();
  }

  const recorded = await study.recordResult(input);

  return {
    flashcardId: input.flashcardId,
    recallStreak: recorded.recallStreak,
  };
}
