import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCollectionService } from "../../../application/collections";
import { createQuizQuestionService } from "../../../application/quiz-questions";
import { createDrizzleQuizRepository } from "./collection-repository";
import { createDrizzleQuizQuestionRepository } from "./quiz-question-repository";

describe("PostgreSQL Quiz Question persistence", () => {
  let client: PGlite;

  beforeEach(async () => {
    client = await PGlite.create();
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  });

  afterEach(async () => {
    await client.close();
  });

  it("transactionally retains Quiz ownership and authored Answer Option order", async () => {
    const database = drizzle(client);
    const quizzes = createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    );
    const firstQuiz = await quizzes.create({ name: "På vei" });
    const secondQuiz = await quizzes.create({ name: "Norsk nå" });
    const questions = createQuizQuestionService(
      createDrizzleQuizQuestionRepository(database),
    );

    const created = await questions.create({
      quizId: firstQuiz.id,
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        { norwegian: "vennlig", english: "friendly", isCorrect: true },
        { norwegian: "sint", english: "angry", isCorrect: false },
      ],
    });

    expect(await questions.list(firstQuiz.id)).toEqual([created]);
    expect(await questions.list(secondQuiz.id)).toEqual([]);
    expect(created.options.map(({ position }) => position)).toEqual([0, 1]);
  });

  it("persists edits with stable option identity without resetting Recall Streak", async () => {
    const database = drizzle(client);
    const quiz = await createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    ).create({ name: "På vei" });
    const questions = createQuizQuestionService(
      createDrizzleQuizQuestionRepository(database),
    );
    const created = await questions.create({
      quizId: quiz.id,
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        { norwegian: "vennlig", english: "friendly", isCorrect: true },
        { norwegian: "sint", english: "angry", isCorrect: false },
      ],
    });

    const updated = await questions.update(quiz.id, created.id, {
      promptNorwegian: "Hva betyr ordet høflig?",
      promptEnglish: "What does the word polite mean?",
      options: [
        { ...created.options[1], isCorrect: true },
        { ...created.options[0], isCorrect: false },
      ],
    });
    const reloaded = await createQuizQuestionService(
      createDrizzleQuizQuestionRepository(database),
    ).get(quiz.id, created.id);

    expect(reloaded).toEqual(updated);
    expect(reloaded?.options.map(({ id }) => id)).toEqual([
      created.options[1].id,
      created.options[0].id,
    ]);
    expect(reloaded?.recallStreak).toBe(0);
  });

  it("rolls back the Question when an Answer Option violates a constraint", async () => {
    const database = drizzle(client);
    const quiz = await createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    ).create({ name: "På vei" });
    const repository = createDrizzleQuizQuestionRepository(database);

    await expect(
      repository.create({
        id: crypto.randomUUID(),
        quizId: quiz.id,
        promptNorwegian: "Hva betyr høflig?",
        promptEnglish: "What does polite mean?",
        recallStreak: 0,
        choiceType: "single",
        options: [
          { id: crypto.randomUUID(), norwegian: "vennlig", english: "friendly", isCorrect: true, position: 0 },
          { id: crypto.randomUUID(), norwegian: " ", english: "angry", isCorrect: false, position: 1 },
        ],
      }),
    ).rejects.toThrow();
    expect(await repository.list(quiz.id)).toEqual([]);
  });

  it("derives choice type from persisted Answer Option correctness", async () => {
    const database = drizzle(client);
    const quiz = await createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    ).create({ name: "På vei" });
    const repository = createDrizzleQuizQuestionRepository(database);

    const created = await repository.create({
      id: crypto.randomUUID(),
      quizId: quiz.id,
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      recallStreak: 0,
      choiceType: "multiple",
      options: [
        { id: crypto.randomUUID(), norwegian: "vennlig", english: "friendly", isCorrect: true, position: 0 },
        { id: crypto.randomUUID(), norwegian: "sint", english: "angry", isCorrect: false, position: 1 },
      ],
    });

    expect(created.choiceType).toBe("single");
    expect(await repository.get(quiz.id, created.id)).toEqual(created);
  });

  it("returns persisted ownership and Recall Streak after a repository update", async () => {
    const database = drizzle(client);
    const quizzes = createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    );
    const quiz = await quizzes.create({ name: "På vei" });
    const otherQuiz = await quizzes.create({ name: "Norsk nå" });
    const repository = createDrizzleQuizQuestionRepository(database);
    const created = await repository.create({
      id: crypto.randomUUID(),
      quizId: quiz.id,
      promptNorwegian: "Hva skjer?",
      promptEnglish: "What is happening?",
      recallStreak: 0,
      choiceType: "single",
      options: [
        { id: crypto.randomUUID(), norwegian: "ingenting", english: "nothing", isCorrect: true, position: 0 },
        { id: crypto.randomUUID(), norwegian: "alt", english: "everything", isCorrect: false, position: 1 },
      ],
    });

    const updated = await repository.update(quiz.id, created.id, {
      ...created,
      quizId: otherQuiz.id,
      recallStreak: 3,
      promptEnglish: "What happens?",
    });

    expect(updated).toMatchObject({
      id: created.id,
      quizId: quiz.id,
      recallStreak: 0,
      promptEnglish: "What happens?",
    });
    expect(updated).toEqual(await repository.get(quiz.id, created.id));
  });
});
