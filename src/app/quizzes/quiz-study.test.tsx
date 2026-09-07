// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuizQuestion } from "@/application/quiz-questions";
import { prepareQuizStudyQuestion } from "@/application/quiz-study";
import { QuizStudySession, type QuizStudyAction } from "./quiz-study";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function singleQuestion(overrides: Partial<QuizQuestion> = {}): QuizQuestion {
  return {
    id: "420d7e63-b4e4-4f5c-b88d-93ab42add48a",
    quizId: "f51ec1e6-f77f-4b58-9de8-828d698b3618",
    promptNorwegian: "Hva betyr høflig?",
    promptEnglish: "What does polite mean?",
    recallStreak: 0,
    choiceType: "single",
    options: [
      {
        id: "bf56aef6-a583-42cb-af8a-d21a4d2a2165",
        norwegian: "vennlig",
        english: "friendly",
        isCorrect: true,
        position: 0,
      },
      {
        id: "2acb88e5-a372-4315-a1ac-48c0cc4c4d82",
        norwegian: "sint",
        english: "angry",
        isCorrect: false,
        position: 1,
      },
    ],
    ...overrides,
  };
}

function multipleQuestion(): QuizQuestion {
  return {
    ...singleQuestion(),
    promptNorwegian: "Hvilke ord er positive?",
    promptEnglish: "Which words are positive?",
    choiceType: "multiple",
    options: [
      {
        id: "bf56aef6-a583-42cb-af8a-d21a4d2a2165",
        norwegian: "vennlig",
        english: "friendly",
        isCorrect: true,
        position: 0,
      },
      {
        id: "41f2fb30-06ec-423a-af44-2e264f21ae52",
        norwegian: "snill",
        english: "kind",
        isCorrect: true,
        position: 1,
      },
      {
        id: "2acb88e5-a372-4315-a1ac-48c0cc4c4d82",
        norwegian: "sint",
        english: "angry",
        isCorrect: false,
        position: 2,
      },
    ],
  };
}

describe("multiple-answer Quiz study", () => {
  it.each([
    [3, 0, "incorrect", "100% Learned", "0% Learned"],
    [0, 1, "correct", "0% Learned", "0% Learned"],
    [3, 3, "correct", "100% Learned", "100% Learned"],
  ] as const)("uses the saved streak %s → %s during feedback", async (before, after, outcome, initial, expected) => {
    const question = singleQuestion({ recallStreak: before });
    render(<QuizStudySession action={async () => ({
      questionId: question.id, outcome, translationHelpUsed: false,
      recallStreak: after, correctOptionIds: [question.options[0].id],
    })} initialAttemptId="attempt" initialQuestionId={question.id}
      questions={[prepareQuizStudyQuestion(question)]} />);
    expect(screen.getByText(initial)).toBeTruthy();
    await userEvent.click(screen.getByRole("radio", { name: outcome === "correct" ? "vennlig" : "sint" }));
    await userEvent.click(screen.getByRole("button", { name: "Submit answer" }));
    expect(await screen.findByRole("button", { name: "Next Question" })).toBeTruthy();
    expect(screen.getByText(expected)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Next Question" }));
    expect(screen.getByText(expected)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Submit answer" })).toBeTruthy();
  });

  it("keeps Quiz Progress through pending and failed saves, then applies a translation-assisted retry once", async () => {
    let rejectSave!: (reason: Error) => void;
    const question = singleQuestion({ recallStreak: 3 });
    const action = vi.fn<QuizStudyAction>()
      .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSave = reject; }))
      .mockResolvedValue({ questionId: question.id, outcome: "incorrect", translationHelpUsed: true,
        recallStreak: 0, correctOptionIds: [question.options[0].id] });
    render(<QuizStudySession action={action} initialAttemptId="attempt"
      initialQuestionId={question.id} questions={[prepareQuizStudyQuestion(question)]} />);
    expect(screen.getByText("100% Learned")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Translation Help" }));
    await userEvent.click(screen.getByRole("radio", { name: /friendly/ }));
    expect(screen.getByText("100% Learned")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Submit answer" }));
    expect(screen.getByRole("button", { name: "Submitting…" })).toHaveProperty("disabled", true);
    expect(screen.getByText("100% Learned")).toBeTruthy();
    await act(async () => rejectSave(new Error("offline")));
    expect(await screen.findByRole("alert")).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit answer" })).toHaveProperty("disabled", false));
    expect(screen.getByRole("radio", { name: /friendly/ })).toHaveProperty("checked", true);
    expect(screen.getByText("100% Learned")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Submit answer" }));
    expect(await screen.findByText("Translation Help used")).toBeTruthy();
    expect(screen.getByText("0% Learned")).toBeTruthy();
    expect(screen.getByText(question.promptEnglish)).toBeTruthy();
    expect(screen.getByRole("radio", { name: /friendly/ })).toHaveProperty("checked", true);
    expect(action.mock.calls[0][0].get("attemptId")).toBe(action.mock.calls[1][0].get("attemptId"));
    await userEvent.click(screen.getByRole("button", { name: "Next Question" }));
    expect(screen.getByText("0% Learned")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Submit answer" })).toBeTruthy();
  });

  it("updates Quiz Progress during feedback without changing answers or counting Next Question twice", async () => {
    const question = singleQuestion({ recallStreak: 2 });
    const action = vi.fn(async () => ({
      questionId: question.id, outcome: "correct" as const, translationHelpUsed: false,
      recallStreak: 3, correctOptionIds: [question.options[0].id],
    }));
    const random = vi.fn().mockReturnValueOnce(0.9).mockReturnValue(0);
    render(<QuizStudySession action={action} initialAttemptId="attempt"
      initialQuestionId={question.id} questions={[prepareQuizStudyQuestion(question),
        prepareQuizStudyQuestion(singleQuestion({ id: "next", promptNorwegian: "Neste spørsmål", recallStreak: 3 }))]}
      random={random} />);
    const answerOrder = screen.getAllByRole("radio").map((input) => (input as HTMLInputElement).value);
    expect(screen.getByText("50% Learned")).toBeTruthy();
    await userEvent.click(screen.getByRole("radio", { name: "vennlig" }));
    expect(screen.getByText("50% Learned")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Submit answer" }));
    expect(await screen.findByText("Correct")).toBeTruthy();
    expect(screen.getByText("100% Learned")).toBeTruthy();
    expect(screen.getByText(question.promptNorwegian)).toBeTruthy();
    expect(screen.getAllByRole("radio").map((input) => (input as HTMLInputElement).value)).toEqual(answerOrder);
    expect(screen.getByRole("radio", { name: /vennlig/ })).toHaveProperty("checked", true);
    await userEvent.click(screen.getByRole("button", { name: "Next Question" }));
    expect(screen.getByText("Neste spørsmål")).toBeTruthy();
    expect(screen.getByText("100% Learned")).toBeTruthy();
  });

  it("shows rounded Quiz Progress across all questions", () => {
    render(<QuizStudySession action={vi.fn()} initialAttemptId="attempt"
      initialQuestionId={singleQuestion().id}
      questions={[0, 2, 3].map((recallStreak, index) =>
        prepareQuizStudyQuestion(singleQuestion({ id: index === 0 ? singleQuestion().id : String(index), recallStreak })))} />);
    expect(screen.getByText("33% Learned")).toBeTruthy();
  });

  it("allows multiple selections before one explicit submission", async () => {
    const action = vi.fn(async () => ({
      questionId: "420d7e63-b4e4-4f5c-b88d-93ab42add48a",
      outcome: "correct" as const,
      translationHelpUsed: false,
      recallStreak: 1,
      correctOptionIds: [
        "bf56aef6-a583-42cb-af8a-d21a4d2a2165",
        "41f2fb30-06ec-423a-af44-2e264f21ae52",
      ],
    }));
    render(
      <QuizStudySession
        action={action}
        initialAttemptId="8de9e5d4-2788-47af-8767-d1a4b6a1b0fd"
        initialQuestionId="420d7e63-b4e4-4f5c-b88d-93ab42add48a"
        questions={[prepareQuizStudyQuestion(multipleQuestion())]}
        random={() => 0.9}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "vennlig" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "snill" }));
    await userEvent.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(await screen.findByText("Correct")).toBeTruthy();
    expect(action.mock.calls[0][0].getAll("selectedOptionIds")).toEqual([
      "bf56aef6-a583-42cb-af8a-d21a4d2a2165",
      "41f2fb30-06ec-423a-af44-2e264f21ae52",
    ]);
    expect(screen.getAllByRole("checkbox").every((control) =>
      (control as HTMLInputElement).disabled
    )).toBe(true);
  });

  it("highlights missed correct options and selected incorrect options", async () => {
    const action = vi.fn(async () => ({
      questionId: "420d7e63-b4e4-4f5c-b88d-93ab42add48a",
      outcome: "incorrect" as const,
      translationHelpUsed: false,
      recallStreak: 0,
      correctOptionIds: [
        "bf56aef6-a583-42cb-af8a-d21a4d2a2165",
        "41f2fb30-06ec-423a-af44-2e264f21ae52",
      ],
    }));
    render(
      <QuizStudySession
        action={action}
        initialAttemptId="8de9e5d4-2788-47af-8767-d1a4b6a1b0fd"
        initialQuestionId="420d7e63-b4e4-4f5c-b88d-93ab42add48a"
        questions={[prepareQuizStudyQuestion(multipleQuestion())]}
        random={() => 0.9}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "vennlig" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "sint" }));
    await userEvent.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(await screen.findByText("Incorrect")).toBeTruthy();
    expect(screen.getAllByText("Correct answer")).toHaveLength(2);
    expect(screen.getByText("Your incorrect selection")).toBeTruthy();
    expect((screen.getByRole("checkbox", { name: /snill/ }) as HTMLInputElement).checked)
      .toBe(false);
    expect((screen.getByRole("checkbox", { name: /sint/ }) as HTMLInputElement).checked)
      .toBe(true);
  });
});

describe("single-answer Quiz study", () => {
  it("hydrates a refreshed study Question without changing Answer Option order", async () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    const props = {
      action: vi.fn(),
      initialAttemptId: "8de9e5d4-2788-47af-8767-d1a4b6a1b0fd",
      initialQuestionId: "420d7e63-b4e4-4f5c-b88d-93ab42add48a",
      questions: [prepareQuizStudyQuestion(singleQuestion())],
    };
    const serverHtml = renderToString(<QuizStudySession {...props} />);
    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.append(container);
    random.mockReturnValue(0.999);
    const hydrationErrors: unknown[] = [];
    let root: Root | undefined;

    await act(async () => {
      root = hydrateRoot(container, <QuizStudySession {...props} />, {
        onRecoverableError: (error) => hydrationErrors.push(error),
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    try {
      expect(hydrationErrors).toEqual([]);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
      random.mockRestore();
    }
  });

  it("allows exactly one Answer Option to be selected", async () => {
    render(
      <QuizStudySession
        action={vi.fn()}
        initialAttemptId="8de9e5d4-2788-47af-8767-d1a4b6a1b0fd"
        initialQuestionId="420d7e63-b4e4-4f5c-b88d-93ab42add48a"
        questions={[prepareQuizStudyQuestion(singleQuestion())]}
        random={() => 0.9}
      />,
    );

    const friendly = screen.getByRole("radio", { name: "vennlig" });
    const angry = screen.getByRole("radio", { name: "sint" });
    await userEvent.click(friendly);
    await userEvent.click(angry);

    expect((friendly as HTMLInputElement).checked).toBe(false);
    expect((angry as HTMLInputElement).checked).toBe(true);
  });

  it("locks the selection and keeps Answer Feedback visible until Next Question", async () => {
    const action = vi.fn(async () => ({
      questionId: "420d7e63-b4e4-4f5c-b88d-93ab42add48a",
      outcome: "correct" as const,
      translationHelpUsed: false,
      recallStreak: 1,
      correctOptionIds: ["bf56aef6-a583-42cb-af8a-d21a4d2a2165"],
    }));
    render(
      <QuizStudySession
        action={action}
        initialAttemptId="8de9e5d4-2788-47af-8767-d1a4b6a1b0fd"
        initialQuestionId="420d7e63-b4e4-4f5c-b88d-93ab42add48a"
        questions={[prepareQuizStudyQuestion(singleQuestion())]}
        random={() => 0.9}
      />,
    );

    const selectedAnswer = screen.getByRole("radio", { name: "vennlig" });
    await userEvent.click(selectedAnswer);
    await userEvent.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(await screen.findByText("Correct")).toBeTruthy();
    expect((screen.getByRole("radio", { name: /vennlig/ }) as HTMLInputElement).checked)
      .toBe(true);
    expect(screen.getByText("Correct answer")).toBeTruthy();
    expect(screen.getByText("Hva betyr høflig?")).toBeTruthy();
    await waitFor(() => expect(screen.getAllByRole("radio").every((radio) =>
      (radio as HTMLInputElement).disabled
    )).toBe(true));
    expect(screen.getByRole("button", { name: "Next Question" })).toBeTruthy();
  });

  it("makes retained English primary and marks the answer translation-assisted", async () => {
    const action = vi.fn(async () => ({
      questionId: "420d7e63-b4e4-4f5c-b88d-93ab42add48a",
      outcome: "incorrect" as const,
      translationHelpUsed: true,
      recallStreak: 0,
      correctOptionIds: ["bf56aef6-a583-42cb-af8a-d21a4d2a2165"],
    }));
    render(
      <QuizStudySession
        action={action}
        initialAttemptId="8de9e5d4-2788-47af-8767-d1a4b6a1b0fd"
        initialQuestionId="420d7e63-b4e4-4f5c-b88d-93ab42add48a"
        questions={[{
          ...prepareQuizStudyQuestion(singleQuestion({
            image: {
              objectKey: "question-images/a/fjord.gif",
              originalName: "fjord.gif",
              contentType: "image/gif",
              byteSize: 2048,
            },
          })),
          imageUrl: "https://bucket.example/fjord.gif",
        }]}
        random={() => 0.9}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Translation Help" }));

    expect(screen.getByText("What does polite mean?")).toBeTruthy();
    expect(screen.getByText("Hva betyr høflig?")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /friendly.*vennlig/i })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Question Image" })).toHaveProperty(
      "src",
      "https://bucket.example/fjord.gif",
    );

    await userEvent.click(screen.getByRole("radio", { name: /friendly.*vennlig/i }));
    await userEvent.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(await screen.findByText("Translation Help used")).toBeTruthy();
    expect(action.mock.calls[0][0].get("translationHelpUsed")).toBe("true");
  });

  it("advances adaptively only after the Learner chooses Next Question", async () => {
    const action = vi.fn(async () => ({
      questionId: "420d7e63-b4e4-4f5c-b88d-93ab42add48a",
      outcome: "incorrect" as const,
      translationHelpUsed: false,
      recallStreak: 0,
      correctOptionIds: ["bf56aef6-a583-42cb-af8a-d21a4d2a2165"],
    }));
    const next = singleQuestion({
      id: "d5766f26-f3f0-42d1-bfa4-67eadacf3042",
      promptNorwegian: "Hva betyr ledig?",
      promptEnglish: "What does available mean?",
      options: [
        { id: "2eb3295c-f69e-43af-87e5-bfd73e49404b", norwegian: "fri", english: "available", isCorrect: true, position: 0 },
        { id: "e23a8ea5-e81e-4b34-b074-18415080af35", norwegian: "opptatt", english: "busy", isCorrect: false, position: 1 },
      ],
    });
    render(
      <QuizStudySession
        action={action}
        initialAttemptId="8de9e5d4-2788-47af-8767-d1a4b6a1b0fd"
        initialQuestionId="420d7e63-b4e4-4f5c-b88d-93ab42add48a"
        questions={[singleQuestion(), next].map(prepareQuizStudyQuestion)}
        random={() => 0}
      />,
    );

    await userEvent.click(screen.getByRole("radio", { name: "sint" }));
    await userEvent.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(await screen.findByText("Incorrect")).toBeTruthy();
    expect((screen.getByRole("radio", { name: /sint/ }) as HTMLInputElement).checked)
      .toBe(true);
    expect(screen.getByText("Hva betyr høflig?")).toBeTruthy();
    expect(screen.queryByText("Hva betyr ledig?")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Next Question" }));

    expect(screen.getByText("Hva betyr ledig?")).toBeTruthy();
    expect(screen.queryByText("Hva betyr høflig?")).toBeNull();
  });

  it("refreshes an image URL when its Question becomes active", async () => {
    const action = vi.fn(async () => ({
      questionId: "420d7e63-b4e4-4f5c-b88d-93ab42add48a",
      outcome: "incorrect" as const,
      translationHelpUsed: false,
      recallStreak: 0,
      correctOptionIds: ["bf56aef6-a583-42cb-af8a-d21a4d2a2165"],
    }));
    const next = singleQuestion({
      id: "d5766f26-f3f0-42d1-bfa4-67eadacf3042",
      promptNorwegian: "Hva ser du?",
      promptEnglish: "What do you see?",
      image: {
        objectKey: "question-images/a/fjord.gif",
        originalName: "fjord.gif",
        contentType: "image/gif",
        byteSize: 2048,
      },
      options: [
        { id: "2eb3295c-f69e-43af-87e5-bfd73e49404b", norwegian: "vann", english: "water", isCorrect: true, position: 0 },
        { id: "e23a8ea5-e81e-4b34-b074-18415080af35", norwegian: "ild", english: "fire", isCorrect: false, position: 1 },
      ],
    });
    const refreshImageUrl = vi.fn(async () =>
      "https://bucket.example/fresh-fjord.gif"
    );
    render(
      <QuizStudySession
        action={action}
        initialAttemptId="8de9e5d4-2788-47af-8767-d1a4b6a1b0fd"
        initialQuestionId="420d7e63-b4e4-4f5c-b88d-93ab42add48a"
        questions={[
          prepareQuizStudyQuestion(singleQuestion()),
          {
            ...prepareQuizStudyQuestion(next),
            imageUrl: "https://bucket.example/expired-fjord.gif",
          },
        ]}
        random={() => 0}
        refreshImageUrl={refreshImageUrl}
      />,
    );

    await userEvent.click(screen.getByRole("radio", { name: "sint" }));
    await userEvent.click(screen.getByRole("button", { name: "Submit answer" }));
    await userEvent.click(await screen.findByRole("button", { name: "Next Question" }));

    await waitFor(() => expect(refreshImageUrl).toHaveBeenCalledWith(next.id));
    await waitFor(() => expect(
      screen.getByRole("img", { name: "Question Image" }),
    ).toHaveProperty("src", "https://bucket.example/fresh-fjord.gif"));
  });

  it("locks answer and Translation Help controls while submission is pending", async () => {
    let finish: ((value: {
      questionId: string;
      outcome: "correct";
      translationHelpUsed: false;
      recallStreak: number;
      correctOptionIds: string[];
    }) => void) | undefined;
    const action = vi.fn(() => new Promise<{
      questionId: string;
      outcome: "correct";
      translationHelpUsed: false;
      recallStreak: number;
      correctOptionIds: string[];
    }>((resolve) => {
      finish = resolve;
    }));
    render(
      <QuizStudySession
        action={action}
        initialAttemptId="8de9e5d4-2788-47af-8767-d1a4b6a1b0fd"
        initialQuestionId="420d7e63-b4e4-4f5c-b88d-93ab42add48a"
        questions={[prepareQuizStudyQuestion(singleQuestion())]}
      />,
    );

    await userEvent.click(screen.getByRole("radio", { name: "vennlig" }));
    void userEvent.click(screen.getByRole("button", { name: "Submit answer" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));

    expect(screen.getAllByRole("radio").every((radio) =>
      (radio as HTMLInputElement).disabled
    )).toBe(true);
    expect(screen.getByRole("button", { name: "Translation Help" }))
      .toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Submitting…" }))
      .toHaveProperty("disabled", true);

    finish?.({
      questionId: "420d7e63-b4e4-4f5c-b88d-93ab42add48a",
      outcome: "correct",
      translationHelpUsed: false,
      recallStreak: 1,
      correctOptionIds: ["bf56aef6-a583-42cb-af8a-d21a4d2a2165"],
    });
    expect(await screen.findByText("Correct")).toBeTruthy();
  });
});
