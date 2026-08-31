import type { Flashcard } from "./flashcards";

export type StudyCandidate = {
  id: string;
  recallStreak: number;
};

export type StudyAssessment = "correct" | "incorrect";

export type StudyResult = {
  id: string;
  flashcardId: string | null;
  assessment: StudyAssessment;
  createdAt: Date;
};

export type RecordedStudyResult = StudyResult & {
  recallStreak: number;
};

export type RecordStudyResult = {
  id: string;
  flashcardId: string;
  assessment: StudyAssessment;
};

export type RecordDeckStudyResult = RecordStudyResult & {
  deckId: string;
};

export interface StudyRepository {
  cards(deckId: string): Promise<Flashcard[]>;
  history(): Promise<StudyResult[]>;
  recordResult(input: RecordDeckStudyResult): Promise<RecordedStudyResult>;
}

export function createStudyScheduler(random: () => number = Math.random) {
  const retryGaps = new Map<string, Set<string>>();

  return {
    next<T extends StudyCandidate>(
      cards: T[],
      previousCardId?: string,
    ): T | undefined {
      const requiredAlternatives = (cardId: string) =>
        Math.min(3, cards.filter(({ id }) => id !== cardId).length);
      const retryGapIsOpen = (cardId: string) => {
        const alternatives = retryGaps.get(cardId);
        return (
          alternatives !== undefined &&
          alternatives.size < requiredAlternatives(cardId)
        );
      };
      let candidates = cards.filter(({ id }) => !retryGapIsOpen(id));
      if (candidates.length === 0) {
        candidates = cards;
      }

      const withoutPrevious = candidates.filter(
        ({ id }) => id !== previousCardId,
      );
      if (withoutPrevious.length > 0) {
        candidates = withoutPrevious;
      }

      const novelAlternatives = candidates.filter(({ id }) =>
        [...retryGaps.entries()].some(
          ([incorrectCardId, seen]) =>
            retryGapIsOpen(incorrectCardId) &&
            id !== incorrectCardId &&
            !seen.has(id),
        ),
      );
      if (novelAlternatives.length > 0) {
        candidates = novelAlternatives;
      }

      const weightOf = (card: StudyCandidate) =>
        Math.max(1, 4 - card.recallStreak);
      const totalWeight = candidates.reduce(
        (total, card) => total + weightOf(card),
        0,
      );
      let selection = random() * totalWeight;

      let selected: T | undefined;
      for (const card of candidates) {
        selection -= weightOf(card);

        if (selection < 0) {
          selected = card;
          break;
        }
      }

      selected ??= candidates.at(-1);

      if (selected) {
        for (const [incorrectCardId, seen] of retryGaps) {
          if (incorrectCardId !== selected.id) {
            seen.add(selected.id);
          }
        }

        if (!retryGapIsOpen(selected.id)) {
          retryGaps.delete(selected.id);
        }
      }

      return selected;
    },
    recordResult(cardId: string, assessment: StudyAssessment) {
      if (assessment === "incorrect") {
        retryGaps.set(cardId, new Set());
      }
    },
  };
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
    cards(deckId: string) {
      return repository.cards(deckId);
    },
    history() {
      return repository.history();
    },
    recordResult(input: RecordDeckStudyResult) {
      return repository.recordResult(input);
    },
  };
}
