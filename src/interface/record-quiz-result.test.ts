import { describe, expect, it, vi } from "vitest";
import { submitQuizAnswer } from "./record-quiz-result";

describe("Quiz answer submission", () => {
  it("records the selected option and returns automatic Answer Feedback", async () => {
    const recordResult = vi.fn(async (input) => ({
      id: input.id,
      questionId: input.questionId,
      outcome: "correct" as const,
      translationHelpUsed: input.translationHelpUsed,
      createdAt: new Date("2026-08-28T12:00:00Z"),
      recallStreak: 1,
      correctOptionId: "bf56aef6-a583-42cb-af8a-d21a4d2a2165",
    }));
    const formData = new FormData();
    formData.set("attemptId", "8de9e5d4-2788-47af-8767-d1a4b6a1b0fd");
    formData.set("questionId", "420d7e63-b4e4-4f5c-b88d-93ab42add48a");
    formData.set("selectedOptionId", "bf56aef6-a583-42cb-af8a-d21a4d2a2165");
    formData.set("translationHelpUsed", "false");

    await expect(
      submitQuizAnswer(
        { recordResult },
        "f51ec1e6-f77f-4b58-9de8-828d698b3618",
        formData,
      ),
    ).resolves.toEqual({
      questionId: "420d7e63-b4e4-4f5c-b88d-93ab42add48a",
      outcome: "correct",
      translationHelpUsed: false,
      recallStreak: 1,
      correctOptionId: "bf56aef6-a583-42cb-af8a-d21a4d2a2165",
    });
  });

  it("rejects an answer without one selected option", async () => {
    const recordResult = vi.fn();
    const formData = new FormData();
    formData.set("attemptId", "8de9e5d4-2788-47af-8767-d1a4b6a1b0fd");
    formData.set("questionId", "420d7e63-b4e4-4f5c-b88d-93ab42add48a");
    formData.set("translationHelpUsed", "false");

    await expect(
      submitQuizAnswer(
        { recordResult },
        "f51ec1e6-f77f-4b58-9de8-828d698b3618",
        formData,
      ),
    ).rejects.toMatchObject({ name: "QuizAnswerSubmissionError" });
    expect(recordResult).not.toHaveBeenCalled();
  });
});
