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
    formData.set("correctOption", "0");

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
    formData.set("correctOption", "1");

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
    formData.set("correctOption", "1");

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
    formData.set("correctOption", "0");

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
    formData.set("correctOption", "0");
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
