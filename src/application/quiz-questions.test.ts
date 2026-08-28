import { describe, expect, it } from "vitest";
import { MemoryQuizQuestionRepository } from "../testing/memory-quiz-question-repository";
import { createQuizQuestionService } from "./quiz-questions";

describe("Quiz Question creation", () => {
  it("creates a single-choice Question and retains authored option order", async () => {
    const questions = createQuizQuestionService(
      new MemoryQuizQuestionRepository(),
    );

    const created = await questions.create({
      quizId: "quiz-a",
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        {
          norwegian: "vennlig og respektfull",
          english: "friendly and respectful",
          isCorrect: true,
        },
        {
          norwegian: "sint og uhøflig",
          english: "angry and rude",
          isCorrect: false,
        },
      ],
    });

    expect(created.choiceType).toBe("single");
    expect(created.options.map(({ norwegian }) => norwegian)).toEqual([
      "vennlig og respektfull",
      "sint og uhøflig",
    ]);
    expect(created.options.map(({ position }) => position)).toEqual([0, 1]);
    expect(await questions.list("quiz-a")).toEqual([created]);
  });

  it("requires complete Norwegian and English content for the prompt and options", async () => {
    const questions = createQuizQuestionService(
      new MemoryQuizQuestionRepository(),
    );

    await expect(
      questions.create({
        quizId: "quiz-a",
        promptNorwegian: " ",
        promptEnglish: "",
        options: [
          { norwegian: "riktig", english: "", isCorrect: true },
          { norwegian: "", english: "wrong", isCorrect: false },
        ],
      }),
    ).rejects.toMatchObject({
      fieldErrors: {
        promptNorwegian: "Enter a Norwegian prompt.",
        promptEnglish: "Enter its English translation.",
        optionErrors: [
          { english: "Enter the English option." },
          { norwegian: "Enter the Norwegian option." },
        ],
      },
    });
    expect(await questions.list("quiz-a")).toEqual([]);
  });

  it("requires at least two Answer Options and one correct option", async () => {
    const questions = createQuizQuestionService(
      new MemoryQuizQuestionRepository(),
    );

    await expect(
      questions.create({
        quizId: "quiz-a",
        promptNorwegian: "Hva betyr høflig?",
        promptEnglish: "What does polite mean?",
        options: [
          {
            norwegian: "vennlig",
            english: "friendly",
            isCorrect: false,
          },
        ],
      }),
    ).rejects.toMatchObject({
      fieldErrors: {
        options: "Add at least two Answer Options.",
        correctness: "Mark at least one Answer Option as correct.",
      },
    });
  });
});

describe("Quiz Question editing", () => {
  it("edits content and option order while preserving identity and Recall Streak", async () => {
    const repository = new MemoryQuizQuestionRepository();
    const questions = createQuizQuestionService(repository);
    const created = await questions.create({
      quizId: "quiz-a",
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        { norwegian: "vennlig", english: "friendly", isCorrect: true },
        { norwegian: "sint", english: "angry", isCorrect: false },
      ],
    });
    repository.setRecallStreak(created.id, 2);

    const updated = await questions.update("quiz-a", created.id, {
      promptNorwegian: "Hva betyr ordet høflig?",
      promptEnglish: "What does the word polite mean?",
      options: [
        { ...created.options[1], isCorrect: true },
        { ...created.options[0], isCorrect: false },
      ],
    });

    expect(updated.recallStreak).toBe(2);
    expect(updated.options.map(({ id }) => id)).toEqual([
      created.options[1].id,
      created.options[0].id,
    ]);
    expect(updated.options.map(({ position }) => position)).toEqual([0, 1]);
    expect(updated.choiceType).toBe("single");
  });

  it("keeps repository lookup identity authoritative during an update", async () => {
    const repository = new MemoryQuizQuestionRepository();
    const questions = createQuizQuestionService(repository);
    const created = await questions.create({
      quizId: "quiz-a",
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        { norwegian: "vennlig", english: "friendly", isCorrect: true },
        { norwegian: "sint", english: "angry", isCorrect: false },
      ],
    });

    const updated = await repository.update("quiz-a", created.id, {
      ...created,
      id: "relocated-question",
      quizId: "quiz-b",
    });

    expect(updated).toMatchObject({ id: created.id, quizId: "quiz-a" });
    expect(await repository.get("quiz-a", created.id)).toEqual(updated);
    expect(await repository.list("quiz-b")).toEqual([]);
  });

  it("does not expose or edit a Question through another Quiz", async () => {
    const questions = createQuizQuestionService(
      new MemoryQuizQuestionRepository(),
    );
    const created = await questions.create({
      quizId: "quiz-a",
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        { norwegian: "vennlig", english: "friendly", isCorrect: true },
        { norwegian: "sint", english: "angry", isCorrect: false },
      ],
    });

    expect(await questions.get("quiz-b", created.id)).toBeUndefined();
    await expect(
      questions.update("quiz-b", created.id, {
        promptNorwegian: "Endret",
        promptEnglish: "Changed",
        options: created.options,
      }),
    ).rejects.toMatchObject({ name: "QuizQuestionNotFoundError" });
    expect(await questions.get("quiz-a", created.id)).toEqual(created);
  });
});
