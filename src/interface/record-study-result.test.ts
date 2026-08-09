import { describe, expect, it, vi } from "vitest";
import { submitStudyAssessment } from "./record-study-result";

describe("study assessment submission", () => {
  it("records the addressed attempt with its self-assessment", async () => {
    const recordResult = vi.fn(async (input) => ({
      ...input,
      createdAt: new Date("2026-08-09T12:00:00Z"),
    }));
    const formData = new FormData();
    formData.set("attemptId", "8de9e5d4-2788-47af-8767-d1a4b6a1b0fd");
    formData.set("flashcardId", "420d7e63-b4e4-4f5c-b88d-93ab42add48a");
    formData.set("assessment", "incorrect");

    await submitStudyAssessment({ recordResult }, formData);

    expect(recordResult).toHaveBeenCalledWith({
      id: "8de9e5d4-2788-47af-8767-d1a4b6a1b0fd",
      flashcardId: "420d7e63-b4e4-4f5c-b88d-93ab42add48a",
      assessment: "incorrect",
    });
  });

  it("rejects a submission that is not Correct or Incorrect", async () => {
    const recordResult = vi.fn();
    const formData = new FormData();
    formData.set("attemptId", "8de9e5d4-2788-47af-8767-d1a4b6a1b0fd");
    formData.set("flashcardId", "420d7e63-b4e4-4f5c-b88d-93ab42add48a");
    formData.set("assessment", "almost");

    await expect(
      submitStudyAssessment({ recordResult }, formData),
    ).rejects.toMatchObject({ name: "StudyAssessmentSubmissionError" });
    expect(recordResult).not.toHaveBeenCalled();
  });
});
