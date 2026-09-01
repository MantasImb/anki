import { describe, expect, it, vi } from "vitest";
import { createQuestionTranslationService } from "../application/question-translation";
import { createQuizQuestionService } from "../application/quiz-questions";
import { MemoryQuizQuestionRepository } from "../testing/memory-quiz-question-repository";
import {
  manageQuizQuestionForm,
  submitQuizQuestionForm,
  translateQuizQuestionForm,
} from "./manage-quiz-question";

describe("Quiz Question form submission", () => {
  it("creates a multiple-answer Question from every marked correct option", async () => {
    const questions = createQuizQuestionService(
      new MemoryQuizQuestionRepository(),
    );
    const formData = new FormData();
    formData.set("promptNorwegian", "Hvilke ord er positive?");
    formData.set("promptEnglish", "Which words are positive?");
    formData.set("options.0.norwegian", "vennlig");
    formData.set("options.0.english", "friendly");
    formData.set("options.1.norwegian", "snill");
    formData.set("options.1.english", "kind");
    formData.set("options.2.norwegian", "sint");
    formData.set("options.2.english", "angry");
    formData.append("correctOptions", "0");
    formData.append("correctOptions", "1");

    await submitQuizQuestionForm(questions, "quiz-a", undefined, formData);

    expect(await questions.list("quiz-a")).toMatchObject([
      {
        choiceType: "multiple",
        options: [
          { isCorrect: true },
          { isCorrect: true },
          { isCorrect: false },
        ],
      },
    ]);
  });

  it("routes the translate intent to preview instead of persistence", async () => {
    const questions = createQuizQuestionService(
      new MemoryQuizQuestionRepository(),
    );
    const formData = new FormData();
    formData.set("intent", "translate");
    formData.set("promptNorwegian", "Hva skjer?");
    formData.set("options.0.norwegian", "ingenting");
    formData.set("options.1.norwegian", "alt");

    await expect(
      manageQuizQuestionForm(
        questions,
        createQuestionTranslationService({
          translate: async () => ["What is happening?", "nothing", "everything"],
        }),
        "quiz-a",
        undefined,
        formData,
      ),
    ).resolves.toMatchObject({ status: "translated" });
    expect(await questions.list("quiz-a")).toEqual([]);
  });

  it("previews one ordered translation request without saving the new Question", async () => {
    const questions = createQuizQuestionService(
      new MemoryQuizQuestionRepository(),
    );
    const translate = vi.fn(async () => [
      "What does polite mean?",
      "friendly",
      "angry",
    ]);
    const formData = new FormData();
    formData.set("promptNorwegian", "Hva betyr høflig?");
    formData.set("options.0.norwegian", "vennlig");
    formData.set("options.1.norwegian", "sint");
    formData.set("correctOptions", "0");

    await expect(
      translateQuizQuestionForm(
        createQuestionTranslationService({ translate }),
        undefined,
        formData,
      ),
    ).resolves.toMatchObject({
      status: "translated",
      values: {
        promptEnglish: "What does polite mean?",
        options: [{ english: "friendly" }, { english: "angry" }],
      },
    });
    expect(translate).toHaveBeenCalledWith([
      "Hva betyr høflig?",
      "vennlig",
      "sint",
    ]);
    expect(await questions.list("quiz-a")).toEqual([]);
  });

  it("retranslates only Norwegian content changed during editing", async () => {
    const translate = vi.fn(async () => ["impolite"]);
    const formData = new FormData();
    formData.set("promptNorwegian", "Hva betyr høflig?");
    formData.set("promptEnglish", "Edited English prompt");
    formData.set("options.0.id", "option-a");
    formData.set("options.0.norwegian", "vennlig");
    formData.set("options.0.english", "friendly");
    formData.set("options.1.id", "option-b");
    formData.set("options.1.norwegian", "uhøflig");
    formData.set("options.1.english", "old English");
    formData.set("correctOptions", "1");

    await expect(
      translateQuizQuestionForm(
        createQuestionTranslationService({ translate }),
        {
          id: "question-a",
          quizId: "quiz-a",
          promptNorwegian: "Hva betyr høflig?",
          promptEnglish: "What does polite mean?",
          recallStreak: 2,
          choiceType: "single",
          options: [
            { id: "option-a", norwegian: "vennlig", english: "friendly", isCorrect: true, position: 0 },
            { id: "option-b", norwegian: "sint", english: "angry", isCorrect: false, position: 1 },
          ],
        },
        formData,
      ),
    ).resolves.toMatchObject({
      status: "translated",
      translatedCount: 1,
      values: {
        promptEnglish: "Edited English prompt",
        options: [
          { id: "option-a", english: "friendly" },
          { id: "option-b", english: "impolite", isCorrect: true },
        ],
      },
    });
    expect(translate).toHaveBeenCalledWith(["uhøflig"]);
  });

  it("makes no translation request for English and correctness-only edits", async () => {
    const translate = vi.fn();
    const formData = new FormData();
    formData.set("promptNorwegian", "Hva betyr høflig?");
    formData.set("promptEnglish", "Learner-edited English");
    formData.set("options.0.id", "option-a");
    formData.set("options.0.norwegian", "vennlig");
    formData.set("options.0.english", "kind");
    formData.set("options.1.id", "option-b");
    formData.set("options.1.norwegian", "sint");
    formData.set("options.1.english", "angry");
    formData.set("correctOptions", "1");

    await expect(
      translateQuizQuestionForm(
        createQuestionTranslationService({ translate }),
        {
          id: "question-a",
          quizId: "quiz-a",
          promptNorwegian: "Hva betyr høflig?",
          promptEnglish: "What does polite mean?",
          recallStreak: 2,
          choiceType: "single",
          options: [
            { id: "option-a", norwegian: "vennlig", english: "friendly", isCorrect: true, position: 0 },
            { id: "option-b", norwegian: "sint", english: "angry", isCorrect: false, position: 1 },
          ],
        },
        formData,
      ),
    ).resolves.toMatchObject({
      status: "translated",
      translatedCount: 0,
      values: {
        promptEnglish: "Learner-edited English",
        options: [{ english: "kind" }, { isCorrect: true }],
      },
    });
    expect(translate).not.toHaveBeenCalled();
  });

  it("retranslates changed Norwegian before saving an existing Question", async () => {
    const questions = createQuizQuestionService(
      new MemoryQuizQuestionRepository(),
    );
    const existing = await questions.create({
      quizId: "quiz-a",
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        { norwegian: "vennlig", english: "friendly", isCorrect: true },
        { norwegian: "sint", english: "angry", isCorrect: false },
      ],
    });
    const translate = vi.fn(async () => ["What does friendly mean?"]);
    const formData = new FormData();
    formData.set("intent", "save");
    formData.set("promptNorwegian", "Hva betyr vennlig?");
    formData.set("promptEnglish", existing.promptEnglish);
    existing.options.forEach((option, index) => {
      formData.set(`options.${index}.id`, option.id);
      formData.set(`options.${index}.norwegian`, option.norwegian);
      formData.set(`options.${index}.english`, option.english);
    });
    formData.set("correctOptions", "0");

    await expect(manageQuizQuestionForm(
      questions,
      createQuestionTranslationService({ translate }),
      "quiz-a",
      existing.id,
      formData,
    )).resolves.toMatchObject({
      status: "translated",
      translatedCount: 1,
      values: {
        promptNorwegian: "Hva betyr vennlig?",
        promptEnglish: "What does friendly mean?",
      },
    });
    expect(translate).toHaveBeenCalledWith(["Hva betyr vennlig?"]);
    expect(await questions.get("quiz-a", existing.id)).toEqual(existing);
  });

  it("saves changed Norwegian after its returned English is reviewed", async () => {
    const questions = createQuizQuestionService(
      new MemoryQuizQuestionRepository(),
    );
    const existing = await questions.create({
      quizId: "quiz-a",
      promptNorwegian: "Hva betyr høflig?",
      promptEnglish: "What does polite mean?",
      options: [
        { norwegian: "vennlig", english: "friendly", isCorrect: true },
        { norwegian: "sint", english: "angry", isCorrect: false },
      ],
    });
    const changed = new FormData();
    changed.set("intent", "save");
    changed.set("promptNorwegian", "Hva betyr vennlig?");
    changed.set("promptEnglish", existing.promptEnglish);
    existing.options.forEach((option, index) => {
      changed.set(`options.${index}.id`, option.id);
      changed.set(`options.${index}.norwegian`, option.norwegian);
      changed.set(`options.${index}.english`, option.english);
    });
    changed.set("correctOptions", "0");
    const translations = createQuestionTranslationService({
      translate: async () => ["What does friendly mean?"],
    });

    const preview = await manageQuizQuestionForm(
      questions,
      translations,
      "quiz-a",
      existing.id,
      changed,
    );
    expect(preview.status).toBe("translated");
    if (preview.status !== "translated") throw new Error("Expected translation preview.");
    const reviewed = new FormData();
    reviewed.set("intent", "save");
    reviewed.set("translationReviewKey", preview.translationReviewKey);
    reviewed.set("promptNorwegian", preview.values.promptNorwegian);
    reviewed.set("promptEnglish", preview.values.promptEnglish);
    preview.values.options.forEach((option, index) => {
      if (option.id) reviewed.set(`options.${index}.id`, option.id);
      reviewed.set(`options.${index}.norwegian`, option.norwegian);
      reviewed.set(`options.${index}.english`, option.english);
    });
    reviewed.set("correctOptions", "0");

    await expect(manageQuizQuestionForm(
      questions,
      translations,
      "quiz-a",
      existing.id,
      reviewed,
    )).resolves.toEqual({ status: "saved", intent: "save" });
    expect(await questions.get("quiz-a", existing.id)).toMatchObject({
      promptNorwegian: "Hva betyr vennlig?",
      promptEnglish: "What does friendly mean?",
    });
  });

  it("reports incomplete Norwegian locally without calling the provider", async () => {
    const translate = vi.fn();
    const formData = new FormData();
    formData.set("promptNorwegian", " ");
    formData.set("options.0.norwegian", "vennlig");
    formData.set("options.1.norwegian", "");

    await expect(
      translateQuizQuestionForm(
        createQuestionTranslationService({ translate }),
        undefined,
        formData,
      ),
    ).resolves.toMatchObject({
      status: "invalid",
      fieldErrors: {
        promptNorwegian: "Enter a Norwegian prompt.",
        optionErrors: [{}, { norwegian: "Enter the Norwegian option." }],
      },
    });
    expect(translate).not.toHaveBeenCalled();
  });

  it("preserves all form work and exposes manual English fallback when translation fails", async () => {
    const formData = new FormData();
    formData.set("promptNorwegian", "Hva betyr høflig?");
    formData.set("promptEnglish", "My draft translation");
    formData.set("options.0.norwegian", "vennlig");
    formData.set("options.0.english", "my friendly draft");
    formData.set("options.1.norwegian", "sint");
    formData.set("options.1.english", "");
    formData.set("correctOptions", "0");

    await expect(
      translateQuizQuestionForm(
        createQuestionTranslationService({
          translate: async () => {
            throw new Error("sensitive provider detail");
          },
        }),
        undefined,
        formData,
      ),
    ).resolves.toEqual({
      status: "translation-failed",
      message:
        "Automatic translation is unavailable. Enter or review the English text manually.",
      translationReviewKey: expect.any(String),
      values: {
        promptNorwegian: "Hva betyr høflig?",
        promptEnglish: "My draft translation",
        options: [
          { norwegian: "vennlig", english: "my friendly draft", isCorrect: true },
          { norwegian: "sint", english: "", isCorrect: false },
        ],
      },
    });
  });

  it("creates a Question in the selected Quiz and retains save-and-add-another intent", async () => {
    const questions = createQuizQuestionService(
      new MemoryQuizQuestionRepository(),
    );
    const formData = new FormData();
    formData.set("promptNorwegian", "Hva betyr høflig?");
    formData.set("promptEnglish", "What does polite mean?");
    formData.set("options.0.norwegian", "vennlig");
    formData.set("options.0.english", "friendly");
    formData.set("options.1.norwegian", "sint");
    formData.set("options.1.english", "angry");
    formData.set("correctOptions", "0");
    formData.set("intent", "save-and-add-another");

    expect(
      await submitQuizQuestionForm(questions, "quiz-a", undefined, formData),
    ).toEqual({ status: "saved", intent: "save-and-add-another" });
    expect(await questions.list("quiz-a")).toMatchObject([
      {
        quizId: "quiz-a",
        options: [{ isCorrect: true }, { isCorrect: false }],
      },
    ]);
  });

  it("returns an actionable failure when a Question cannot be saved", async () => {
    const saveFailure = new Error("database unavailable");
    const formData = new FormData();
    formData.set("promptNorwegian", "Hva betyr høflig?");
    formData.set("promptEnglish", "What does polite mean?");
    formData.set("options.0.norwegian", "vennlig");
    formData.set("options.0.english", "friendly");
    formData.set("options.1.norwegian", "sint");
    formData.set("options.1.english", "angry");
    formData.set("correctOptions", "0");

    await expect(
      submitQuizQuestionForm(
        {
          create: async () => { throw saveFailure; },
          update: async () => { throw saveFailure; },
        },
        "quiz-a",
        undefined,
        formData,
      ),
    ).resolves.toEqual({
      status: "failed",
      message: "Question could not be saved. Try again.",
    });
  });

  it("returns complete validation feedback without saving partial content", async () => {
    const questions = createQuizQuestionService(
      new MemoryQuizQuestionRepository(),
    );
    const formData = new FormData();
    formData.set("promptNorwegian", " ");
    formData.set("promptEnglish", "");
    formData.set("options.0.norwegian", "riktig");
    formData.set("options.0.english", "");
    formData.set("options.1.norwegian", "");
    formData.set("options.1.english", "wrong");

    expect(
      await submitQuizQuestionForm(questions, "quiz-a", undefined, formData),
    ).toMatchObject({
      status: "invalid",
      fieldErrors: {
        promptNorwegian: "Enter a Norwegian prompt.",
        promptEnglish: "Enter its English translation.",
        correctness: "Mark at least one Answer Option as correct.",
      },
    });
    expect(await questions.list("quiz-a")).toEqual([]);
  });
});
