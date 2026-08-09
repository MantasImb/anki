import { describe, expect, it } from "vitest";
import type { Flashcard } from "./flashcards";
import {
  createStudyService,
  nextRecallStreak,
  type RecordStudyResult,
  type StudyRepository,
  type StudyResult,
} from "./study";

class MemoryStudyRepository implements StudyRepository {
  private readonly results: StudyResult[] = [];

  constructor(readonly cards: Flashcard[]) {}

  async nextCard(afterCardId?: string): Promise<Flashcard | undefined> {
    if (!afterCardId) {
      return this.cards[0];
    }

    const currentIndex = this.cards.findIndex(({ id }) => id === afterCardId);
    return this.cards[(currentIndex + 1) % this.cards.length];
  }

  async history(): Promise<StudyResult[]> {
    return [...this.results];
  }

  async recordResult(input: RecordStudyResult): Promise<StudyResult> {
    const existing = this.results.find(({ id }) => id === input.id);

    if (existing) {
      return existing;
    }

    const card = this.cards.find(({ id }) => id === input.flashcardId);

    if (!card) {
      throw new Error("Flashcard was not found.");
    }

    card.recallStreak = nextRecallStreak(
      card.recallStreak,
      input.assessment,
    );
    const result = { ...input, createdAt: new Date() };
    this.results.push(result);
    return result;
  }
}

describe("Recall Streak transitions", () => {
  it("increments after a Correct Study Result", () => {
    expect(nextRecallStreak(1, "correct")).toBe(2);
  });

  it("caps a Correct Recall Streak at three", () => {
    expect(nextRecallStreak(3, "correct")).toBe(3);
  });

  it("resets the Recall Streak after an Incorrect Study Result", () => {
    expect(nextRecallStreak(2, "incorrect")).toBe(0);
  });
});

describe("study session", () => {
  it("starts immediately with a saved Flashcard", async () => {
    const flashcard = {
      id: "card-1",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
      recallStreak: 0,
    };
    const study = createStudyService(
      new MemoryStudyRepository([flashcard]),
    );

    expect(await study.nextCard()).toEqual(flashcard);
  });

  it("advances to the next saved Flashcard after an assessment", async () => {
    const first = {
      id: "card-1",
      front: "høflig",
      back: "polite",
      recallStreak: 0,
    };
    const second = {
      id: "card-2",
      front: "ledig",
      back: "available",
      recallStreak: 0,
    };
    const study = createStudyService(
      new MemoryStudyRepository([first, second]),
    );

    expect(await study.nextCard(first.id)).toEqual(second);
  });

  it("records a Correct result and retains the updated streak", async () => {
    const flashcard = {
      id: "card-1",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
      recallStreak: 0,
    };
    const study = createStudyService(
      new MemoryStudyRepository([flashcard]),
    );

    const recorded = await study.recordResult({
      id: "attempt-1",
      flashcardId: flashcard.id,
      assessment: "correct",
    });

    expect(recorded).toMatchObject({
      id: "attempt-1",
      flashcardId: flashcard.id,
      assessment: "correct",
    });
    expect(await study.history()).toEqual([recorded]);
    expect(await study.nextCard()).toMatchObject({ recallStreak: 1 });
  });

  it("records only one result for a repeated study attempt", async () => {
    const flashcard = {
      id: "card-1",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
      recallStreak: 0,
    };
    const study = createStudyService(
      new MemoryStudyRepository([flashcard]),
    );
    const attempt = {
      id: "attempt-1",
      flashcardId: flashcard.id,
      assessment: "correct" as const,
    };

    const first = await study.recordResult(attempt);
    const repeated = await study.recordResult(attempt);

    expect(repeated).toEqual(first);
    expect(await study.history()).toEqual([first]);
    expect(await study.nextCard()).toMatchObject({ recallStreak: 1 });
  });
});
