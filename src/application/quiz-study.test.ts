import { describe, expect, it } from "vitest";
import {
  calculateQuizProgress,
  createQuizStudyService,
  createQuizStudyScheduler,
  gradeSingleAnswer,
  prepareQuizStudyQuestion,
  shuffleAnswerOptions,
  type QuizResult,
  type QuizStudyRepository,
  type RecordQuizResult,
  type RecordedQuizResult,
} from "./quiz-study";
import { nextRecallStreak } from "./study";
import type { QuizQuestion } from "./quiz-questions";

const weightedQuestions: QuizQuestion[] = [
  question("question-0", 0),
  question("question-1", 1),
  question("question-2", 2),
  question("question-3", 3),
];

function question(id: string, recallStreak: number): QuizQuestion {
  return {
    id,
    quizId: "quiz-a",
    promptNorwegian: id,
    promptEnglish: id,
    recallStreak,
    choiceType: "single",
    options: [
      { id: `${id}-correct`, norwegian: "ja", english: "yes", isCorrect: true, position: 0 },
      { id: `${id}-incorrect`, norwegian: "nei", english: "no", isCorrect: false, position: 1 },
    ],
  };
}

describe("single-answer Quiz grading", () => {
  it("grades the selected correct Answer Option as Correct", () => {
    expect(
      gradeSingleAnswer(
        [
          { id: "option-correct", isCorrect: true },
          { id: "option-incorrect", isCorrect: false },
        ],
        "option-correct",
        false,
      ),
    ).toBe("correct");
  });

  it("grades a selected incorrect Answer Option as Incorrect", () => {
    expect(
      gradeSingleAnswer(
        [
          { id: "option-correct", isCorrect: true },
          { id: "option-incorrect", isCorrect: false },
        ],
        "option-incorrect",
        false,
      ),
    ).toBe("incorrect");
  });

  it("grades a translation-assisted selection as Incorrect", () => {
    expect(
      gradeSingleAnswer(
        [{ id: "option-correct", isCorrect: true }],
        "option-correct",
        true,
      ),
    ).toBe("incorrect");
  });
});

describe("Answer Option presentation", () => {
  it("omits correctness from the Question sent to the study client", () => {
    const prepared = prepareQuizStudyQuestion(question("question-a", 0));

    expect(prepared.options).toEqual([
      {
        id: "question-a-correct",
        norwegian: "ja",
        english: "yes",
        position: 0,
      },
      {
        id: "question-a-incorrect",
        norwegian: "nei",
        english: "no",
        position: 1,
      },
    ]);
  });

  it("shuffles complete Answer Options without changing their associations", () => {
    const options = [
      {
        id: "option-a",
        norwegian: "vennlig",
        english: "friendly",
        isCorrect: true,
        position: 0,
      },
      {
        id: "option-b",
        norwegian: "sint",
        english: "angry",
        isCorrect: false,
        position: 1,
      },
      {
        id: "option-c",
        norwegian: "rolig",
        english: "calm",
        isCorrect: false,
        position: 2,
      },
    ];

    const shuffled = shuffleAnswerOptions(options, () => 0);

    expect(shuffled.map(({ id }) => id)).toEqual([
      "option-b",
      "option-c",
      "option-a",
    ]);
    expect(shuffled.find(({ id }) => id === "option-a")).toEqual(options[0]);
    expect(options.map(({ id }) => id)).toEqual([
      "option-a",
      "option-b",
      "option-c",
    ]);
  });
});

describe("adaptive Quiz Question ordering", () => {
  it.each([
    [0, "question-0"],
    [0.39, "question-0"],
    [0.4, "question-1"],
    [0.69, "question-1"],
    [0.7, "question-2"],
    [0.89, "question-2"],
    [0.9, "question-3"],
    [0.99, "question-3"],
  ])("selects by the 4/3/2/1 weight boundaries at %s", (random, id) => {
    expect(createQuizStudyScheduler(() => random).next(weightedQuestions)?.id)
      .toBe(id);
  });

  it("holds an Incorrect Question back for three other Questions", () => {
    const scheduler = createQuizStudyScheduler(() => 0);
    const questions = [...weightedQuestions, question("question-4", 0)];
    scheduler.recordResult("question-0", "incorrect");

    expect(scheduler.next(questions)?.id).toBe("question-1");
    expect(scheduler.next(questions, "question-1")?.id).toBe("question-2");
    expect(scheduler.next(questions, "question-2")?.id).toBe("question-3");
    expect(scheduler.next(questions, "question-3")?.id).toBe("question-0");
  });

  it("shows every available alternative before retrying in a tiny Quiz", () => {
    const scheduler = createQuizStudyScheduler(() => 0);
    const questions = weightedQuestions.slice(0, 3);
    scheduler.recordResult("question-0", "incorrect");

    expect(scheduler.next(questions)?.id).toBe("question-1");
    expect(scheduler.next(questions, "question-1")?.id).toBe("question-2");
    expect(scheduler.next(questions, "question-2")?.id).toBe("question-0");
  });
});

describe("Quiz Progress", () => {
  it("counts only active Questions at Recall Streak three as Learned", () => {
    expect(calculateQuizProgress([question("learned", 3), question("active", 2)]))
      .toEqual({ learned: 1, total: 2, percentage: 50 });
  });
});

class MemoryQuizStudyRepository implements QuizStudyRepository {
  private readonly results: QuizResult[] = [];
  private readonly recordedById = new Map<string, RecordedQuizResult>();

  constructor(private readonly storedQuestions: QuizQuestion[]) {}

  async questions(quizId: string) {
    return structuredClone(
      this.storedQuestions.filter((candidate) => candidate.quizId === quizId),
    );
  }

  async history() {
    return structuredClone(this.results);
  }

  async recordResult(input: RecordQuizResult): Promise<RecordedQuizResult> {
    const existing = this.recordedById.get(input.id);
    if (existing) return structuredClone(existing);
    const stored = this.storedQuestions.find(
      ({ id, quizId }) => id === input.questionId && quizId === input.quizId,
    );
    if (!stored) throw new Error("Quiz Question was not found.");
    const outcome = gradeSingleAnswer(
      stored.options,
      input.selectedOptionId,
      input.translationHelpUsed,
    );
    stored.recallStreak = nextRecallStreak(stored.recallStreak, outcome);
    const result: QuizResult = {
      id: input.id,
      questionId: input.questionId,
      outcome,
      translationHelpUsed: input.translationHelpUsed,
      createdAt: new Date("2026-08-28T12:00:00Z"),
    };
    this.results.push(result);
    const recorded: RecordedQuizResult = {
      ...result,
      recallStreak: stored.recallStreak,
      correctOptionId: stored.options.find(({ isCorrect }) => isCorrect)!.id,
    };
    this.recordedById.set(input.id, recorded);
    return structuredClone(recorded);
  }
}

describe("Quiz study session", () => {
  it("loads only Questions from the selected Quiz", async () => {
    const selected = question("selected", 0);
    const other = { ...question("other", 0), quizId: "quiz-b" };
    const study = createQuizStudyService(
      new MemoryQuizStudyRepository([selected, other]),
    );

    expect(await study.questions("quiz-a")).toEqual([selected]);
  });

  it("records an unassisted correct selection and increments Recall Streak", async () => {
    const stored = question("question-a", 1);
    const study = createQuizStudyService(
      new MemoryQuizStudyRepository([stored]),
    );

    const recorded = await study.recordResult({
      id: "attempt-a",
      quizId: "quiz-a",
      questionId: stored.id,
      selectedOptionId: "question-a-correct",
      translationHelpUsed: false,
    });

    expect(recorded).toMatchObject({
      id: "attempt-a",
      questionId: stored.id,
      outcome: "correct",
      translationHelpUsed: false,
      recallStreak: 2,
    });
    expect(await study.questions("quiz-a")).toEqual([
      expect.objectContaining({ recallStreak: 2 }),
    ]);
  });

  it("records a translation-assisted correct selection as Incorrect and resets Recall Streak", async () => {
    const stored = question("question-a", 2);
    const study = createQuizStudyService(
      new MemoryQuizStudyRepository([stored]),
    );

    const recorded = await study.recordResult({
      id: "attempt-a",
      quizId: "quiz-a",
      questionId: stored.id,
      selectedOptionId: "question-a-correct",
      translationHelpUsed: true,
    });

    expect(recorded).toMatchObject({
      outcome: "incorrect",
      translationHelpUsed: true,
      recallStreak: 0,
    });
  });

  it("does not advance twice when an answer submission is repeated", async () => {
    const stored = question("question-a", 0);
    const study = createQuizStudyService(
      new MemoryQuizStudyRepository([stored]),
    );
    const attempt = {
      id: "attempt-a",
      quizId: "quiz-a",
      questionId: stored.id,
      selectedOptionId: "question-a-correct",
      translationHelpUsed: false,
    };

    const first = await study.recordResult(attempt);
    const repeated = await study.recordResult(attempt);

    expect(repeated).toEqual(first);
    expect(await study.history()).toHaveLength(1);
    expect(await study.questions("quiz-a")).toEqual([
      expect.objectContaining({ recallStreak: 1 }),
    ]);
  });
});
