import type { Flashcard } from "./flashcards";

export type StudyAssessment = "correct" | "incorrect";

export type StudyResult = {
  id: string;
  flashcardId: string | null;
  assessment: StudyAssessment;
  createdAt: Date;
};

export type RecordStudyResult = {
  id: string;
  flashcardId: string;
  assessment: StudyAssessment;
};

export interface StudyRepository {
  nextCard(afterCardId?: string): Promise<Flashcard | undefined>;
  history(): Promise<StudyResult[]>;
  recordResult(input: RecordStudyResult): Promise<StudyResult>;
}

export function nextRecallStreak(
  current: number,
  assessment: StudyAssessment,
) {
  if (assessment === "incorrect") {
    return 0;
  }

  return Math.min(current + 1, 3);
}

export function createStudyService(repository: StudyRepository) {
  return {
    nextCard(afterCardId?: string) {
      return repository.nextCard(afterCardId);
    },
    history() {
      return repository.history();
    },
    recordResult(input: RecordStudyResult) {
      return repository.recordResult(input);
    },
  };
}
