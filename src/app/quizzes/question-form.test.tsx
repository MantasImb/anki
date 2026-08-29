// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuizQuestion } from "@/application/quiz-questions";
import { QuestionForm } from "./question-form";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function questionWithImage(): QuizQuestion {
  return {
    id: "question-a",
    quizId: "quiz-a",
    promptNorwegian: "Hva ser du?",
    promptEnglish: "What do you see?",
    recallStreak: 0,
    choiceType: "single",
    image: {
      objectKey: "question-images/a/fjord.gif",
      originalName: "fjord.gif",
      contentType: "image/gif",
      byteSize: 2048,
    },
    options: [
      { id: "option-a", norwegian: "vann", english: "water", isCorrect: true, position: 0 },
      { id: "option-b", norwegian: "ild", english: "fire", isCorrect: false, position: 1 },
    ],
  };
}

describe("Quiz Question form", () => {
  it("allows more than one Answer Option to be marked correct", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ status: "idle" as const }));
    render(<QuestionForm action={action} />);

    await user.click(screen.getByLabelText("Correct option 2"));
    await user.click(screen.getByRole("button", { name: "Save Question" }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    const submitted = action.mock.calls[0][1] as FormData;
    expect(submitted.getAll("correctOptions")).toEqual(["0", "1"]);
  });

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
    expect(submitted.getAll("correctOptions")).toEqual(["1"]);
  });

  it("shows the selected image size and a non-blocking warning above 5 MB", async () => {
    const user = userEvent.setup();
    render(<QuestionForm action={async () => ({ status: "idle" })} />);
    const file = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      "stor.png",
      { type: "image/png" },
    );

    await user.upload(screen.getByLabelText("Question Image"), file);

    expect(screen.getByText((_, element) =>
      element?.tagName === "P" && element.textContent?.includes("5.0 MB") === true,
    )).toBeTruthy();
    expect(screen.getByText(/larger than 5 MB/i)).toBeTruthy();
  });

  it("rejects unsupported image types before upload", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(<QuestionForm action={vi.fn()} />);

    await user.upload(
      screen.getByLabelText("Question Image"),
      new File(["document"], "notes.pdf", { type: "application/pdf" }),
    );

    expect(screen.getByRole("alert").textContent).toContain(
      "Choose a JPEG, PNG, WebP, or GIF image.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uploads and completes a new image before submitting the Question", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ status: "idle" as const }));
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        uploadId: "b4d89f5b-e0f8-41f2-86bb-87e1bb5f9c18",
        uploadUrl: "https://bucket.example/upload",
        expiresInSeconds: 300,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        uploadId: "b4d89f5b-e0f8-41f2-86bb-87e1bb5f9c18",
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    render(<QuestionForm action={action} />);
    await user.upload(
      screen.getByLabelText("Question Image"),
      new File(["image"], "fjord.png", { type: "image/png" }),
    );

    await user.click(screen.getByRole("button", { name: "Save Question" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "/api/question-images/authorize",
      "https://bucket.example/upload",
      "/api/question-images/complete",
    ]);
    expect((action.mock.calls[0][1] as FormData).get("imageUploadId")).toBe(
      "b4d89f5b-e0f8-41f2-86bb-87e1bb5f9c18",
    );
  });

  it("keeps the current image during translation and can mark it for removal", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ status: "idle" as const }));
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(
      <QuestionForm
        action={action}
        imageUrl="https://bucket.example/read"
        question={{
          id: "question-a",
          quizId: "quiz-a",
          promptNorwegian: "Hva ser du?",
          promptEnglish: "What do you see?",
          recallStreak: 0,
          choiceType: "single",
          image: {
            objectKey: "question-images/a/fjord.gif",
            originalName: "fjord.gif",
            contentType: "image/gif",
            byteSize: 2048,
          },
          options: [
            { id: "option-a", norwegian: "vann", english: "water", isCorrect: true, position: 0 },
            { id: "option-b", norwegian: "ild", english: "fire", isCorrect: false, position: 1 },
          ],
        }}
      />,
    );

    expect(screen.getByRole("img", { name: "Current Question Image" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Translate to English" }));
    expect(fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove image" }));
    await user.click(screen.getByRole("button", { name: "Save Question" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect((action.mock.calls[1][1] as FormData).get("removeImage")).toBe("true");
  });

  it("keeps the current image when a replacement selection is cleared", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ status: "idle" as const }));
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(
      <QuestionForm
        action={action}
        imageUrl="https://bucket.example/read"
        question={questionWithImage()}
      />,
    );
    const input = screen.getByLabelText("Question Image");

    await user.upload(
      input,
      new File(["replacement"], "replacement.png", { type: "image/png" }),
    );
    expect(screen.queryByRole("img", { name: "Current Question Image" })).toBeNull();
    await user.upload(input, []);
    expect(screen.getByRole("img", { name: "Current Question Image" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Save Question" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect((action.mock.calls[0][1] as FormData).get("removeImage")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
