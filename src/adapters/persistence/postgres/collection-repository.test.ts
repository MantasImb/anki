import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCollectionService } from "../../../application/collections";
import { createFlashcardService } from "../../../application/flashcards";
import { createStudyService } from "../../../application/study";
import { createQuestionImageService } from "../../../application/question-images";
import { createQuizQuestionService } from "../../../application/quiz-questions";
import { createQuizStudyService } from "../../../application/quiz-study";
import { createDrizzleFlashcardRepository } from "./flashcard-repository";
import { createDrizzleStudyRepository } from "./study-repository";
import { createDrizzleQuestionImageUploadRepository } from "./question-image-upload-repository";
import { createDrizzleQuizQuestionRepository } from "./quiz-question-repository";
import { createDrizzleQuizStudyRepository } from "./quiz-study-repository";
import {
  createDrizzleFlashcardDeckRepository,
  createDrizzleQuizRepository,
} from "./collection-repository";

describe("PostgreSQL collection persistence", () => {
  let client: PGlite;

  beforeEach(async () => {
    client = await PGlite.create();
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  });

  afterEach(async () => {
    await client.close();
  });

  it("creates no default collections in a fresh database", async () => {
    const decks = createCollectionService(
      "Flashcard Deck",
      createDrizzleFlashcardDeckRepository(drizzle(client)),
    );
    const quizzes = createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(drizzle(client)),
    );

    expect(await decks.list()).toEqual([]);
    expect(await quizzes.list()).toEqual([]);
  });

  it("retains a Flashcard Deck for a new repository instance", async () => {
    const firstConnection = createCollectionService(
      "Flashcard Deck",
      createDrizzleFlashcardDeckRepository(drizzle(client)),
    );
    const created = await firstConnection.create({ name: "På vei" });

    const secondConnection = createCollectionService(
      "Flashcard Deck",
      createDrizzleFlashcardDeckRepository(drizzle(client)),
    );

    expect(await secondConnection.list()).toEqual([created]);
    expect(await secondConnection.get(created.id)).toEqual(created);
  });

  it("enforces independent Deck and Quiz name constraints", async () => {
    const decks = createCollectionService(
      "Flashcard Deck",
      createDrizzleFlashcardDeckRepository(drizzle(client)),
    );
    const quizzes = createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(drizzle(client)),
    );

    await decks.create({ name: "På vei" });
    const quiz = await quizzes.create({ name: "  PÅ   VEI " });

    await expect(quizzes.create({ name: "på vei" })).rejects.toMatchObject({
      name: "CollectionNameConflictError",
    });
    expect(await quizzes.list()).toEqual([quiz]);
  });

  it("prevents a blank collection name from being persisted directly", async () => {
    const repository = createDrizzleFlashcardDeckRepository(drizzle(client));

    await expect(
      repository.create({
        id: crypto.randomUUID(),
        name: " \n ",
        nameKey: "",
      }),
    ).rejects.toThrow();
    expect(await repository.list()).toEqual([]);
  });

  it("deletes a Deck with its active Flashcards while retaining detached Study Results", async () => {
    const database = drizzle(client);
    const decks = createCollectionService(
      "Flashcard Deck",
      createDrizzleFlashcardDeckRepository(database),
    );
    const deck = await decks.create({ name: "Delte navn" });
    const quizzes = createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    );
    const quiz = await quizzes.create({ name: "Delte navn" });
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const card = await flashcards.create({
      deckId: deck.id,
      front: "rolig",
      back: "calm",
    });
    const study = createStudyService(createDrizzleStudyRepository(database));
    await study.recordResult({
      id: crypto.randomUUID(),
      deckId: deck.id,
      flashcardId: card.id,
      assessment: "correct",
    });

    await decks.delete(deck.id);

    expect(await decks.get(deck.id)).toBeUndefined();
    expect(await flashcards.list(deck.id)).toEqual([]);
    expect(await study.history()).toEqual([
      expect.objectContaining({ flashcardId: null, assessment: "correct" }),
    ]);
    expect(await quizzes.get(quiz.id)).toEqual(quiz);
    await expect(decks.delete(deck.id)).rejects.toMatchObject({
      name: "CollectionNotFoundError",
    });
  });

  it("deletes a Quiz, detaches its history, and queues every Question Image for cleanup", async () => {
    const database = drizzle(client);
    const quizzes = createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    );
    const quiz = await quizzes.create({ name: "Bildequiz" });
    const uploadRepository = createDrizzleQuestionImageUploadRepository(database);
    let cleanupFails = true;
    const images = createQuestionImageService({
      presignUpload: async () => "https://bucket.example/upload",
      presignRead: async () => "https://bucket.example/read",
      head: async () => ({ contentType: "image/png", byteSize: 2048 }),
      delete: async () => {
        if (cleanupFails) throw new Error("bucket unavailable");
      },
    }, uploadRepository);
    const upload = await images.authorize({
      originalName: "fjord.png",
      contentType: "image/png",
      byteSize: 2048,
    });
    await images.complete(upload.uploadId);
    const questions = createQuizQuestionService(
      createDrizzleQuizQuestionRepository(database),
    );
    const question = await questions.create({
      quizId: quiz.id,
      promptNorwegian: "Hva ser du?",
      promptEnglish: "What do you see?",
      imageUploadId: upload.uploadId,
      options: [
        { norwegian: "en fjord", english: "a fjord", isCorrect: true },
        { norwegian: "en by", english: "a city", isCorrect: false },
      ],
    });
    const study = createQuizStudyService(
      createDrizzleQuizStudyRepository(database),
    );
    await study.recordResult({
      id: crypto.randomUUID(),
      quizId: quiz.id,
      questionId: question.id,
      selectedOptionIds: [question.options[0].id],
      translationHelpUsed: false,
    });

    const deletingQuizzes = createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
      () => images.cleanup(),
    );
    await deletingQuizzes.delete(quiz.id);

    expect(await quizzes.get(quiz.id)).toBeUndefined();
    expect(await questions.list(quiz.id)).toEqual([]);
    expect(await study.history()).toEqual([
      expect.objectContaining({ questionId: null, outcome: "correct" }),
    ]);
    expect(await uploadRepository.listCleanup()).toEqual([
      question.image?.objectKey,
    ]);
    cleanupFails = false;
    await expect(images.cleanup()).resolves.toEqual({ cleaned: 1, failed: 0 });
    expect(await uploadRepository.listCleanup()).toEqual([]);
  });
});
