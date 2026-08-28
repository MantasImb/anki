import { describe, expect, it } from "vitest";
import type { Flashcard } from "./flashcards";
import {
  createStudyScheduler,
  createStudyService,
  nextRecallStreak,
  type RecordDeckStudyResult,
  type RecordedStudyResult,
  type StudyRepository,
  type StudyResult,
} from "./study";

const weightedCards: Flashcard[] = [
  { id: "card-0", deckId: "deck-a", front: "null", back: "zero", recallStreak: 0 },
  { id: "card-1", deckId: "deck-a", front: "én", back: "one", recallStreak: 1 },
  { id: "card-2", deckId: "deck-a", front: "to", back: "two", recallStreak: 2 },
  { id: "card-3", deckId: "deck-a", front: "tre", back: "three", recallStreak: 3 },
];

describe("adaptive study ordering", () => {
  it.each([
    [0, "card-0"],
    [0.39, "card-0"],
    [0.4, "card-1"],
    [0.69, "card-1"],
    [0.7, "card-2"],
    [0.89, "card-2"],
    [0.9, "card-3"],
    [0.99, "card-3"],
  ])("selects by the 4/3/2/1 weight boundaries at %s", (random, id) => {
    const scheduler = createStudyScheduler(() => random);

    expect(scheduler.next(weightedCards)?.id).toBe(id);
  });

  it("holds an Incorrect Flashcard back for three other study positions", () => {
    const cards = [
      ...weightedCards,
      { id: "card-4", deckId: "deck-a", front: "fire", back: "four", recallStreak: 0 },
    ];
    const scheduler = createStudyScheduler(() => 0);

    scheduler.recordResult("card-0", "incorrect");

    expect(scheduler.next(cards)?.id).toBe("card-1");
    expect(scheduler.next(cards, "card-1")?.id).toBe("card-2");
    expect(scheduler.next(cards, "card-2")?.id).toBe("card-3");
    expect(scheduler.next(cards, "card-3")?.id).toBe("card-0");
  });

  it("shows every available alternative before retrying in a tiny collection", () => {
    const cards = weightedCards.slice(0, 3);
    const scheduler = createStudyScheduler(() => 0);

    scheduler.recordResult("card-0", "incorrect");

    expect(scheduler.next(cards)?.id).toBe("card-1");
    expect(scheduler.next(cards, "card-1")?.id).toBe("card-2");
    expect(scheduler.next(cards, "card-2")?.id).toBe("card-0");
  });

  it("starts a new Retry Gap when a retried Flashcard is Incorrect again", () => {
    const cards = weightedCards.slice(0, 2);
    const scheduler = createStudyScheduler(() => 0);

    scheduler.recordResult("card-0", "incorrect");
    expect(scheduler.next(cards)?.id).toBe("card-1");
    expect(scheduler.next(cards, "card-1")?.id).toBe("card-0");

    scheduler.recordResult("card-0", "incorrect");

    expect(scheduler.next(cards, "card-0")?.id).toBe("card-1");
  });

  it("keeps a one-card session moving when no alternative exists", () => {
    const cards = weightedCards.slice(0, 1);
    const scheduler = createStudyScheduler(() => 0);

    scheduler.recordResult("card-0", "incorrect");

    expect(scheduler.next(cards, "card-0")?.id).toBe("card-0");
  });

  it("clears the Retry Gap when a fresh session starts", () => {
    const firstSession = createStudyScheduler(() => 0);
    firstSession.recordResult("card-0", "incorrect");
    expect(firstSession.next(weightedCards)?.id).toBe("card-1");

    const freshSession = createStudyScheduler(() => 0);

    expect(freshSession.next(weightedCards)?.id).toBe("card-0");
  });

  it("keeps moving if every Flashcard is temporarily in a Retry Gap", () => {
    const cards = weightedCards.slice(0, 2);
    const scheduler = createStudyScheduler(() => 0);
    scheduler.recordResult("card-0", "incorrect");
    scheduler.recordResult("card-1", "incorrect");

    expect(scheduler.next(cards)?.id).toBe("card-0");
  });

  it("keeps an out-of-range mastered Flashcard eligible at minimum weight", () => {
    const scheduler = createStudyScheduler(() => 0);
    const cards = [
      { id: "mastered", deckId: "deck-a", front: "ferdig", back: "finished", recallStreak: 7 },
      weightedCards[0],
    ];

    expect(scheduler.next(cards)?.id).toBe("mastered");
  });
});

class MemoryStudyRepository implements StudyRepository {
  private readonly results: StudyResult[] = [];

  constructor(readonly flashcards: Flashcard[]) {}

  async cards(deckId: string): Promise<Flashcard[]> {
    return this.flashcards.filter((flashcard) => flashcard.deckId === deckId);
  }

  async history(): Promise<StudyResult[]> {
    return [...this.results];
  }

  async recordResult(input: RecordDeckStudyResult): Promise<RecordedStudyResult> {
    const { deckId, ...resultInput } = input;
    const existing = this.results.find(({ id }) => id === input.id);
    const card = this.flashcards.find(
      ({ id, deckId: ownerDeckId }) =>
        id === input.flashcardId && ownerDeckId === deckId,
    );

    if (!card) {
      throw new Error("Flashcard was not found.");
    }

    if (existing) {
      return { ...existing, recallStreak: card.recallStreak };
    }

    card.recallStreak = nextRecallStreak(
      card.recallStreak,
      input.assessment,
    );
    const result = { ...resultInput, createdAt: new Date() };
    this.results.push(result);
    return { ...result, recallStreak: card.recallStreak };
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
  it("loads only Flashcards from the selected Deck", async () => {
    const selected = {
      id: "card-a",
      deckId: "deck-a",
      front: "høflig",
      back: "polite",
      recallStreak: 0,
    };
    const study = createStudyService(
      new MemoryStudyRepository([
        selected,
        {
          id: "card-b",
          deckId: "deck-b",
          front: "ledig",
          back: "available",
          recallStreak: 0,
        },
      ]),
    );

    expect(await study.cards("deck-a")).toEqual([selected]);
  });

  it("starts immediately with a saved Flashcard", async () => {
    const flashcard = {
      id: "card-1",
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
      recallStreak: 0,
    };
    const study = createStudyService(
      new MemoryStudyRepository([flashcard]),
    );

    expect(await study.cards("deck-a")).toEqual([flashcard]);
  });

  it("records a Correct result and retains the updated streak", async () => {
    const flashcard = {
      id: "card-1",
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
      recallStreak: 0,
    };
    const study = createStudyService(
      new MemoryStudyRepository([flashcard]),
    );

    const recorded = await study.recordResult({
      id: "attempt-1",
      deckId: "deck-a",
      flashcardId: flashcard.id,
      assessment: "correct",
    });

    expect(recorded).toMatchObject({
      id: "attempt-1",
      flashcardId: flashcard.id,
      assessment: "correct",
    });
    expect(await study.history()).toEqual([
      expect.objectContaining({ id: recorded.id }),
    ]);
    expect(await study.cards("deck-a")).toEqual([
      expect.objectContaining({ recallStreak: 1 }),
    ]);
  });

  it("cannot record a result for a Flashcard outside the selected Deck", async () => {
    const flashcard = {
      id: "card-1",
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
      recallStreak: 0,
    };
    const study = createStudyService(
      new MemoryStudyRepository([flashcard]),
    );

    await expect(
      study.recordResult({
        id: "attempt-1",
        deckId: "deck-b",
        flashcardId: flashcard.id,
        assessment: "correct",
      }),
    ).rejects.toThrow("Flashcard was not found.");
    expect(flashcard.recallStreak).toBe(0);
  });

  it("records only one result for a repeated study attempt", async () => {
    const flashcard = {
      id: "card-1",
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
      recallStreak: 0,
    };
    const study = createStudyService(
      new MemoryStudyRepository([flashcard]),
    );
    const attempt = {
      id: "attempt-1",
      deckId: "deck-a",
      flashcardId: flashcard.id,
      assessment: "correct" as const,
    };

    const first = await study.recordResult(attempt);
    const repeated = await study.recordResult(attempt);

    expect(repeated).toEqual(first);
    expect(await study.history()).toEqual([
      expect.objectContaining({ id: first.id }),
    ]);
    expect(await study.cards("deck-a")).toEqual([
      expect.objectContaining({ recallStreak: 1 }),
    ]);
  });
});
