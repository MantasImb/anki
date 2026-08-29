// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QuizDetail } from "./quiz-detail";

afterEach(cleanup);

describe("Quiz detail", () => {
  it("lists Questions in management order with Quiz-scoped actions", () => {
    render(
      <QuizDetail
        quiz={{ id: "quiz-a", name: "På vei" }}
        questions={[
          {
            id: "question-a",
            quizId: "quiz-a",
            promptNorwegian: "Hva betyr høflig?",
            promptEnglish: "What does polite mean?",
            recallStreak: 0,
            choiceType: "single",
            options: [
              { id: "option-b", norwegian: "sint", english: "angry", isCorrect: false, position: 0 },
              { id: "option-a", norwegian: "vennlig", english: "friendly", isCorrect: true, position: 1 },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Add Question" }).getAttribute("href"))
      .toBe("/quizzes/quiz-a/questions/new");
    expect(screen.getByRole("link", { name: "Edit Question" }).getAttribute("href"))
      .toBe("/quizzes/quiz-a/questions/question-a/edit");
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "sint — angry — Incorrect",
      "vennlig — friendly — Correct",
    ]);
    expect(screen.getByText("Quiz Progress: 0% Learned")).toBeTruthy();
    expect(screen.getByText("Recall Streak 0/3")).toBeTruthy();
  });
});
