import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCollectionService } from "../../../application/collections";
import { createQuizQuestionService } from "../../../application/quiz-questions";
import { createQuestionImageService } from "../../../application/question-images";
import { createDrizzleQuizRepository } from "./collection-repository";
import { createDrizzleQuizQuestionRepository } from "./quiz-question-repository";
import { createDrizzleQuestionImageUploadRepository } from "./question-image-upload-repository";

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

  it("attaches only a completed upload and persists stable image metadata", async () => {
    const database = drizzle(client);
    const quiz = await createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    ).create({ name: "Bilder" });
    const uploadRepository = createDrizzleQuestionImageUploadRepository(database);
    const storage = {
      presignUpload: async () => "https://bucket.example/upload",
      presignRead: async () => "https://bucket.example/read",
      head: async () => ({ contentType: "image/png", byteSize: 2048 }),
      delete: async () => undefined,
    };
    const images = createQuestionImageService(storage, uploadRepository);
    const questions = createQuizQuestionService(
      createDrizzleQuizQuestionRepository(database),
    );
    const authorization = await images.authorize({
      originalName: "fjord.png",
      contentType: "image/png",
      byteSize: 2048,
    });

    await expect(questions.create({
      quizId: quiz.id,
      promptNorwegian: "Hvor er dette?",
      promptEnglish: "Where is this?",
      imageUploadId: authorization.uploadId,
      options: [
        { norwegian: "en fjord", english: "a fjord", isCorrect: true },
        { norwegian: "en by", english: "a city", isCorrect: false },
      ],
    })).rejects.toThrow("Finish uploading the Question Image before saving.");
    expect(await questions.list(quiz.id)).toEqual([]);

    await images.complete(authorization.uploadId);
    const created = await questions.create({
      quizId: quiz.id,
      promptNorwegian: "Hvor er dette?",
      promptEnglish: "Where is this?",
      imageUploadId: authorization.uploadId,
      options: [
        { norwegian: "en fjord", english: "a fjord", isCorrect: true },
        { norwegian: "en by", english: "a city", isCorrect: false },
      ],
    });

    expect(created.image).toMatchObject({
      objectKey: expect.stringMatching(/^question-images\//),
      originalName: "fjord.png",
      contentType: "image/png",
      byteSize: 2048,
    });
    expect(await questions.get(quiz.id, created.id)).toEqual(created);

    const repository = createDrizzleQuizQuestionRepository(database);
    const textOnlyUpdate = await repository.update(quiz.id, created.id, {
      ...created,
      image: undefined,
      promptEnglish: "Where was this photographed?",
    });
    expect(textOnlyUpdate).toMatchObject({
      promptEnglish: "Where was this photographed?",
      image: created.image,
    });
  });

  it("updates the Question before making a replaced or removed image retryable for cleanup", async () => {
    const database = drizzle(client);
    const quiz = await createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    ).create({ name: "Bilder" });
    const uploadRepository = createDrizzleQuestionImageUploadRepository(database);
    const images = createQuestionImageService({
      presignUpload: async () => "https://bucket.example/upload",
      presignRead: async () => "https://bucket.example/read",
      head: async (objectKey) => ({
        contentType: objectKey.endsWith("replacement.gif") ? "image/gif" : "image/png",
        byteSize: objectKey.endsWith("replacement.gif") ? 4096 : 2048,
      }),
      delete: async () => undefined,
    }, uploadRepository);
    const questions = createQuizQuestionService(
      createDrizzleQuizQuestionRepository(database),
    );
    const first = await images.authorize({
      originalName: "first.png",
      contentType: "image/png",
      byteSize: 2048,
    });
    await images.complete(first.uploadId);
    const created = await questions.create({
      quizId: quiz.id,
      promptNorwegian: "Hva ser du?",
      promptEnglish: "What do you see?",
      imageUploadId: first.uploadId,
      options: [
        { norwegian: "vann", english: "water", isCorrect: true },
        { norwegian: "ild", english: "fire", isCorrect: false },
      ],
    });
    const replacement = await images.authorize({
      originalName: "replacement.gif",
      contentType: "image/gif",
      byteSize: 4096,
    });
    await images.complete(replacement.uploadId);

    const replaced = await questions.update(quiz.id, created.id, {
      promptNorwegian: created.promptNorwegian,
      promptEnglish: created.promptEnglish,
      options: created.options,
      imageUploadId: replacement.uploadId,
    });
    expect(replaced?.image?.originalName).toBe("replacement.gif");
    expect(await uploadRepository.listCleanup()).toEqual([
      created.image?.objectKey,
    ]);

    const removed = await questions.update(quiz.id, created.id, {
      promptNorwegian: created.promptNorwegian,
      promptEnglish: created.promptEnglish,
      options: created.options,
      removeImage: true,
    });
    expect(removed?.image).toBeUndefined();
    expect(await uploadRepository.listCleanup()).toEqual([
      created.image?.objectKey,
      replaced?.image?.objectKey,
    ]);
  });

  it("deletes only the scoped Question and queues its image for cleanup", async () => {
    const database = drizzle(client);
    const quizzes = createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(database),
    );
    const quiz = await quizzes.create({ name: "Slett bilde" });
    const otherQuiz = await quizzes.create({ name: "Behold bilde" });
    const uploadRepository = createDrizzleQuestionImageUploadRepository(database);
    const images = createQuestionImageService({
      presignUpload: async () => "https://bucket.example/upload",
      presignRead: async () => "https://bucket.example/read",
      head: async () => ({ contentType: "image/png", byteSize: 2048 }),
      delete: async () => undefined,
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
    const deleted = await questions.create({
      quizId: quiz.id,
      promptNorwegian: "Hva ser du?",
      promptEnglish: "What do you see?",
      imageUploadId: upload.uploadId,
      options: [
        { norwegian: "en fjord", english: "a fjord", isCorrect: true },
        { norwegian: "en by", english: "a city", isCorrect: false },
      ],
    });
    const retained = await questions.create({
      quizId: otherQuiz.id,
      promptNorwegian: "Hva hører du?",
      promptEnglish: "What do you hear?",
      options: [
        { norwegian: "musikk", english: "music", isCorrect: true },
        { norwegian: "regn", english: "rain", isCorrect: false },
      ],
    });

    await questions.delete(quiz.id, deleted.id);

    expect(await questions.list(quiz.id)).toEqual([]);
    expect(await questions.list(otherQuiz.id)).toEqual([retained]);
    expect(await uploadRepository.listCleanup()).toEqual([
      deleted.image?.objectKey,
    ]);
  });
});
