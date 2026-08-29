import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCollectionService } from "../../../application/collections";
import { createQuizQuestionService } from "../../../application/quiz-questions";
import { createQuizStudyService } from "../../../application/quiz-study";
import { createDrizzleQuizRepository } from "./collection-repository";
import { createDrizzleQuizQuestionRepository } from "./quiz-question-repository";
import { createDrizzleQuizStudyRepository } from "./quiz-study-repository";

describe("PostgreSQL Quiz study persistence", () => {
  let client: PGlite;

  beforeEach(async () => {
    client = await PGlite.create();
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  });

  afterEach(async () => {
    await client.close();
  });

  it("atomically records the stored correct option and increments Recall Streak", async () => {
    const database = drizzle(client);
    const quiz = await createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    ).create({ name: "På vei" });
    const questions = createQuizQuestionService(
      createDrizzleQuizQuestionRepository(database),
    );
    const question = await questions.create({
      quizId: quiz.id,
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        { norwegian: "vennlig", english: "friendly", isCorrect: true },
        { norwegian: "sint", english: "angry", isCorrect: false },
      ],
    });
    const study = createQuizStudyService(
      createDrizzleQuizStudyRepository(database),
    );

    const recorded = await study.recordResult({
      id: crypto.randomUUID(),
      quizId: quiz.id,
      questionId: question.id,
      selectedOptionId: question.options[0].id,
      translationHelpUsed: false,
    });
    const { recallStreak, correctOptionId, ...result } = recorded;

    expect(recallStreak).toBe(1);
    expect(correctOptionId).toBe(question.options[0].id);
    expect(result).toMatchObject({
      questionId: question.id,
      outcome: "correct",
      translationHelpUsed: false,
    });
    expect(await study.history()).toEqual([result]);
    expect(await questions.get(quiz.id, question.id)).toMatchObject({
      recallStreak: 1,
    });
  });

  it("does not insert or advance twice for a repeated submission", async () => {
    const database = drizzle(client);
    const quiz = await createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    ).create({ name: "På vei" });
    const questions = createQuizQuestionService(
      createDrizzleQuizQuestionRepository(database),
    );
    const question = await questions.create({
      quizId: quiz.id,
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        { norwegian: "vennlig", english: "friendly", isCorrect: true },
        { norwegian: "sint", english: "angry", isCorrect: false },
      ],
    });
    const study = createQuizStudyService(
      createDrizzleQuizStudyRepository(database),
    );
    const attempt = {
      id: crypto.randomUUID(),
      quizId: quiz.id,
      questionId: question.id,
      selectedOptionId: question.options[0].id,
      translationHelpUsed: false,
    };

    const first = await study.recordResult(attempt);
    const repeated = await study.recordResult(attempt);

    expect(repeated).toEqual(first);
    expect(await study.history()).toHaveLength(1);
    expect(await questions.get(quiz.id, question.id)).toMatchObject({
      recallStreak: 1,
    });
  });

  it("rolls back the Quiz Result when the Recall Streak update fails", async () => {
    const database = drizzle(client);
    const quiz = await createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    ).create({ name: "På vei" });
    const questions = createQuizQuestionService(
      createDrizzleQuizQuestionRepository(database),
    );
    const question = await questions.create({
      quizId: quiz.id,
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        { norwegian: "vennlig", english: "friendly", isCorrect: true },
        { norwegian: "sint", english: "angry", isCorrect: false },
      ],
    });
    const study = createQuizStudyService(
      createDrizzleQuizStudyRepository(database),
    );
    await client.exec(`
      create function reject_question_streak_update() returns trigger as $$
      begin
        raise exception 'question streak update rejected';
      end;
      $$ language plpgsql;

      create trigger reject_question_streak_update
      before update of recall_streak on quiz_questions
      for each row execute function reject_question_streak_update();
    `);

    await expect(
      study.recordResult({
        id: crypto.randomUUID(),
        quizId: quiz.id,
        questionId: question.id,
        selectedOptionId: question.options[0].id,
        translationHelpUsed: false,
      }),
    ).rejects.toThrow();

    expect(await study.history()).toEqual([]);
    expect(await questions.get(quiz.id, question.id)).toMatchObject({
      recallStreak: 0,
    });
  });

  it("persists Translation Help use as Incorrect and resets Recall Streak", async () => {
    const database = drizzle(client);
    const quiz = await createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    ).create({ name: "På vei" });
    const questions = createQuizQuestionService(
      createDrizzleQuizQuestionRepository(database),
    );
    const question = await questions.create({
      quizId: quiz.id,
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        { norwegian: "vennlig", english: "friendly", isCorrect: true },
        { norwegian: "sint", english: "angry", isCorrect: false },
      ],
    });
    const study = createQuizStudyService(
      createDrizzleQuizStudyRepository(database),
    );
    const correctSelection = question.options[0].id;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await study.recordResult({
        id: crypto.randomUUID(),
        quizId: quiz.id,
        questionId: question.id,
        selectedOptionId: correctSelection,
        translationHelpUsed: false,
      });
    }

    const assisted = await study.recordResult({
      id: crypto.randomUUID(),
      quizId: quiz.id,
      questionId: question.id,
      selectedOptionId: correctSelection,
      translationHelpUsed: true,
    });

    expect(assisted).toMatchObject({
      outcome: "incorrect",
      translationHelpUsed: true,
      recallStreak: 0,
    });
    expect(await questions.get(quiz.id, question.id)).toMatchObject({
      recallStreak: 0,
    });
  });
});
