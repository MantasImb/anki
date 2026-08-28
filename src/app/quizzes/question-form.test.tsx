// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuestionForm } from "./question-form";

afterEach(cleanup);

describe("Quiz Question form", () => {
  it("shows an editable translation preview before saving the reviewed English", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async (_state, formData: FormData) => {
      if (formData.get("intent") === "translate") {
        return {
          status: "translated" as const,
          translatedCount: 3,
          values: {
            promptNorwegian: String(formData.get("promptNorwegian")),
            promptEnglish: "What does polite mean?",
            options: [
              { norwegian: "vennlig", english: "friendly", isCorrect: true },
              { norwegian: "sint", english: "angry", isCorrect: false },
            ],
          },
        };
      }
      return { status: "saved" as const, intent: "save" as const };
    });
    render(<QuestionForm action={action} />);

    await user.type(screen.getByLabelText("Norwegian prompt"), "Hva betyr høflig?");
    await user.type(screen.getByLabelText("Norwegian option 1"), "vennlig");
    await user.type(screen.getByLabelText("Norwegian option 2"), "sint");
    await user.click(screen.getByRole("button", { name: "Translate to English" }));

    expect(await screen.findByDisplayValue("What does polite mean?")).toBeTruthy();
    expect(screen.getByDisplayValue("friendly")).toBeTruthy();
    await user.clear(screen.getByLabelText("English option 1"));
    await user.type(screen.getByLabelText("English option 1"), "kind");
    await user.click(screen.getByRole("button", { name: "Save Question" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    const reviewed = action.mock.calls[1][1] as FormData;
    expect(reviewed.get("options.0.english")).toBe("kind");
  });

  it("keeps Norwegian work available for manual fallback and translation retry", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn()
      .mockResolvedValueOnce({
        status: "translation-failed" as const,
        message:
          "Automatic translation is unavailable. Enter or review the English text manually.",
        values: {
          promptNorwegian: "Hva skjer?",
          promptEnglish: "",
          options: [
            { norwegian: "ingenting", english: "", isCorrect: true },
            { norwegian: "alt", english: "", isCorrect: false },
          ],
        },
      })
      .mockResolvedValueOnce({
        status: "translated" as const,
        translatedCount: 3,
        values: {
          promptNorwegian: "Hva skjer?",
          promptEnglish: "What is happening?",
          options: [
            { norwegian: "ingenting", english: "nothing", isCorrect: true },
            { norwegian: "alt", english: "everything", isCorrect: false },
          ],
        },
      });
    render(<QuestionForm action={action} />);

    await user.type(screen.getByLabelText("Norwegian prompt"), "Hva skjer?");
    await user.type(screen.getByLabelText("Norwegian option 1"), "ingenting");
    await user.type(screen.getByLabelText("Norwegian option 2"), "alt");
    await user.click(screen.getByRole("button", { name: "Translate to English" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Enter or review the English text manually.",
    );
    expect(screen.getByDisplayValue("Hva skjer?")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Translate to English" }));
    expect(await screen.findByDisplayValue("What is happening?")).toBeTruthy();
  });

  it("starts with two options and offers both save paths", async () => {
    const user = userEvent.setup();
    render(<QuestionForm action={async () => ({ status: "idle" })} />);

    expect(screen.getByLabelText("Norwegian option 1")).toBeTruthy();
    expect(screen.getByLabelText("Norwegian option 2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save Question" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Save and add another" }),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Add option" }));
    expect(screen.getByLabelText("Norwegian option 3")).toBeTruthy();
  });

  it("keeps a correct option when the currently correct option is removed", async () => {
    const user = userEvent.setup();
    render(<QuestionForm action={async () => ({ status: "idle" })} />);

    await user.click(screen.getByRole("button", { name: "Add option" }));
    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(
      (screen.getByLabelText("Correct option 1") as HTMLInputElement).checked,
    ).toBe(true);
  });

  it("associates repeated option controls with their Option heading", () => {
    render(<QuestionForm action={async () => ({ status: "idle" })} />);

    for (const control of [
      screen.getAllByRole("button", { name: "Move up" })[1],
      screen.getAllByRole("button", { name: "Move down" })[1],
      screen.getAllByRole("button", { name: "Remove" })[1],
    ]) {
      expect(control.getAttribute("aria-describedby")).toBe(
        "option-initial-1-heading",
      );
    }
    expect(document.getElementById("option-initial-1-heading")?.textContent)
      .toBe("Option 2");
  });

  it("submits reordered options with their stable identities", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ status: "idle" as const }));
    render(
      <QuestionForm
        action={action}
        question={{
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
        }}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Move up" })[1]);
    await user.click(screen.getByRole("button", { name: "Save Question" }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    const submitted = action.mock.calls[0][1] as FormData;
    expect(submitted.get("options.0.id")).toBe("option-b");
    expect(submitted.get("options.1.id")).toBe("option-a");
    expect(submitted.get("correctOption")).toBe("1");
  });
});
