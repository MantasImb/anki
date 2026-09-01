// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { QuizQuestion } from "@/application/quiz-questions";
import { QuizDetail } from "./quiz-detail";

afterEach(cleanup);

function question(id: string): QuizQuestion {
  return {
    id,
    quizId: "quiz-a",
    promptNorwegian: `Spørsmål ${id}`,
    promptEnglish: `Question ${id}`,
    recallStreak: 0,
    choiceType: "single",
    options: [],
  };
}

describe("Quiz detail", () => {
  it("shows Quiz Progress beside the total Question count", () => {
    render(
      <QuizDetail
        deleteAction={async () => ({ status: "idle" })}
        quiz={{ id: "quiz-a", name: "På vei" }}
        questions={[question("question-a"), question("question-b")]}
      />,
    );

    expect(
      screen.getByText("Quiz Progress: 0% Learned · 2 questions"),
    ).toBeTruthy();
  });

  it("uses a singular label for one Question", () => {
    render(
      <QuizDetail
        deleteAction={async () => ({ status: "idle" })}
        quiz={{ id: "quiz-a", name: "På vei" }}
        questions={[question("question-a")]}
      />,
    );

    expect(
      screen.getByText("Quiz Progress: 0% Learned · 1 question"),
    ).toBeTruthy();
  });

  it("updates the count with the saved Questions and hides statistics when empty", () => {
    const props = {
      deleteAction: async () => ({ status: "idle" as const }),
      quiz: { id: "quiz-a", name: "På vei" },
    };
    const { rerender } = render(
      <QuizDetail {...props} questions={[question("question-a")]} />,
    );

    rerender(
      <QuizDetail
        {...props}
        questions={[question("question-a"), question("question-b")]}
      />,
    );
    expect(
      screen.getByText("Quiz Progress: 0% Learned · 2 questions"),
    ).toBeTruthy();

    rerender(<QuizDetail {...props} questions={[]} />);
    expect(screen.queryByText(/Quiz Progress:/)).toBeNull();
    expect(screen.queryByText(/0 questions/)).toBeNull();
    expect(screen.getByText("No questions yet")).toBeTruthy();
  });

  it("lists Questions in management order with Quiz-scoped actions", () => {
    render(
      <QuizDetail
        deleteAction={async () => ({ status: "idle" })}
        quiz={{ id: "quiz-a", name: "På vei" }}
        questions={[
          {
            id: "question-a",
            quizId: "quiz-a",
            promptNorwegian: "Hva betyr høflig?",
            promptEnglish: "What does polite mean?",
            recallStreak: 0,
            choiceType: "single",
            image: {
              objectKey: "question-images/a/fjord.gif",
              originalName: "fjord.gif",
              contentType: "image/gif",
              byteSize: 2048,
            },
            imageUrl: "https://bucket.example/fjord.gif",
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
    expect(screen.getByText("Recall Streak 0/3")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Question Image for Hva betyr høflig?" }))
      .toHaveProperty("src", "https://bucket.example/fjord.gif");
  });
});
