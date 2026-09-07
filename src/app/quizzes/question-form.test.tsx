// @vitest-environment jsdom

import { Component, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuizQuestion } from "@/application/quiz-questions";
import { QuestionForm } from "./question-form";
import { translateQuizQuestionForm } from "@/interface/manage-quiz-question";
import { createQuestionTranslationService } from "@/application/question-translation";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

class NavigationBoundary extends Component<
  { children: ReactNode },
  { error?: Error }
> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    return this.state.error
      ? <p>Navigation left the form.</p>
      : this.props.children;
  }
}

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
  it("lets successful save navigation leave the Question form", async () => {
    const user = userEvent.setup();
    const navigation = new Error("NEXT_REDIRECT");
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <NavigationBoundary>
        <QuestionForm action={async () => { throw navigation; }} />
      </NavigationBoundary>,
    );

    await user.click(
      screen.getByRole("button", { name: "Save and add another" }),
    );

    expect(await screen.findByText("Navigation left the form.")).toBeTruthy();
    expect(screen.queryByText("NEXT_REDIRECT")).toBeNull();
  });

  it("navigates after saving a Question with a newly uploaded image", async () => {
    const user = userEvent.setup();
    const navigation = new Error("NEXT_REDIRECT");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const action = vi.fn(async (_state, formData: FormData) => {
      if (formData.get("intent") === "prepare-save") {
        return { status: "ready" as const };
      }
      throw navigation;
    });
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        uploadId: "b4d89f5b-e0f8-41f2-86bb-87e1bb5f9c18",
        uploadUrl: "https://bucket.example/upload",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        uploadId: "b4d89f5b-e0f8-41f2-86bb-87e1bb5f9c18",
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    render(
      <NavigationBoundary>
        <QuestionForm action={action} />
      </NavigationBoundary>,
    );
    await user.upload(
      screen.getByLabelText("Question Image"),
      new File(["image"], "fjord.png", { type: "image/png" }),
    );

    await user.click(
      screen.getByRole("button", { name: "Save and add another" }),
    );

    expect(await screen.findByText("Navigation left the form.")).toBeTruthy();
    expect(screen.queryByText("NEXT_REDIRECT")).toBeNull();
  });

  it("keeps Question content when saving fails", async () => {
    const user = userEvent.setup();
    render(
      <QuestionForm
        action={async () => ({
          status: "failed",
          message: "Question could not be saved. Try again.",
        })}
      />,
    );
    await user.type(
      screen.getByLabelText("Norwegian prompt"),
      "Hva betyr høflig?",
    );

    await user.click(
      screen.getByRole("button", { name: "Save and add another" }),
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Question could not be saved. Try again.",
    );
    expect(screen.getByDisplayValue("Hva betyr høflig?")).toBeTruthy();
  });

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
    const action = vi.fn(async (_state, formData: FormData) =>
      formData.get("intent") === "prepare-save"
        ? { status: "ready" as const }
        : { status: "idle" as const }
    );
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

    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "/api/question-images/authorize",
      "https://bucket.example/upload",
      "/api/question-images/complete",
    ]);
    expect((action.mock.calls[1][1] as FormData).get("imageUploadId")).toBe(
      "b4d89f5b-e0f8-41f2-86bb-87e1bb5f9c18",
    );
  });

  it("keeps Question content and reports a Question Image upload failure", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async (_state, formData: FormData) =>
      formData.get("intent") === "prepare-save"
        ? { status: "ready" as const }
        : { status: "idle" as const }
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({
        message: "Question Image upload authorization failed.",
      }), { status: 503 }),
    ));
    render(<QuestionForm action={action} />);
    await user.type(
      screen.getByLabelText("Norwegian prompt"),
      "Hva ser du?",
    );
    await user.upload(
      screen.getByLabelText("Question Image"),
      new File(["image"], "fjord.png", { type: "image/png" }),
    );

    await user.click(screen.getByRole("button", { name: "Save Question" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Question Image upload authorization failed.",
    );
    expect(screen.getByDisplayValue("Hva ser du?")).toBeTruthy();
    expect(screen.getByText(/fjord\.png/)).toBeTruthy();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("does not upload a selected image when Question content is invalid", async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const action = vi.fn(async (_state, formData: FormData) => ({
      status: "invalid" as const,
      fieldErrors: {
        promptNorwegian: "Enter a Norwegian prompt.",
        promptEnglish: "Enter its English translation.",
      },
      values: {
        promptNorwegian: String(formData.get("promptNorwegian")),
        promptEnglish: String(formData.get("promptEnglish")),
        options: [
          { norwegian: "", english: "", isCorrect: true },
          { norwegian: "", english: "", isCorrect: false },
        ],
      },
    }));
    render(<QuestionForm action={action} />);
    await user.upload(
      screen.getByLabelText("Question Image"),
      new File([new Uint8Array([1, 2, 3])], "fjord.png", {
        type: "image/png",
      }),
    );

    await user.click(screen.getByRole("button", { name: "Save Question" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Question was not saved",
    );
    expect(action).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
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

describe("Question paste assistance", () => {
  const pasted = "Rett til å tilby drosjetjenester…\nEnerett\nReisebevis\nRutestyring\nFelleskapstillatelse";

  it("fills a fresh form and offers ordinary paste through Undo", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({ status: "idle" as const }));
    render(<QuestionForm action={action} />);
    const prompt = screen.getByLabelText<HTMLTextAreaElement>("Norwegian prompt");
    await user.click(prompt);
    await user.paste(pasted);
    expect(prompt.value).toBe("Rett til å tilby drosjetjenester…");
    expect(screen.getAllByLabelText(/Norwegian option/).map((input) => (input as HTMLInputElement).value)).toEqual(["Enerett", "Reisebevis", "Rutestyring", "Felleskapstillatelse"]);
    expect(screen.getAllByRole("checkbox").every((input) => !(input as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByText("Answers were auto-filled")).toBeTruthy();
    expect(document.activeElement).toBe(prompt);
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(prompt.value).toBe(pasted);
    expect(screen.getAllByLabelText(/Norwegian option/)).toHaveLength(2);
    expect((screen.getByLabelText("Correct option 1") as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    expect(document.activeElement).toBe(prompt);
    expect(action).not.toHaveBeenCalled();
  });
});

it.each([[4, 4], [4, 7]])("appends in edit mode and undoes an insertion or selection (%i, %i)", async (start, end) => {
  const user = userEvent.setup();
  render(<QuestionForm action={async () => ({ status: "idle" })} question={questionWithImage()} imageUrl="/image.gif" />);
  const prompt = screen.getByLabelText<HTMLTextAreaElement>("Norwegian prompt");
  await user.click(prompt);
  prompt.setSelectionRange(start, end);
  await user.paste(" Nytt? \r\n ja \r\n nei ");
  expect(prompt.value).toBe("Hva ser du?".slice(0, start) + "Nytt?" + "Hva ser du?".slice(end));
  expect(screen.getAllByLabelText(/Norwegian option/).map((input) => (input as HTMLInputElement).value)).toEqual(["vann", "ild", "ja", "nei"]);
  expect(screen.getByLabelText<HTMLInputElement>("English option 1").value).toBe("water");
  expect(screen.getByLabelText<HTMLInputElement>("Correct option 1").checked).toBe(true);
  expect(screen.getByLabelText<HTMLTextAreaElement>("English prompt translation").value).toBe("");
  expect(screen.getByAltText("Current Question Image")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Undo" }));
  expect(prompt.value).toBe("Hva ser du?".slice(0, start) + " Nytt? \n ja \n nei " + "Hva ser du?".slice(end));
  expect(screen.getByLabelText<HTMLTextAreaElement>("English prompt translation").value).toBe("What do you see?");
  expect(screen.getAllByLabelText(/Norwegian option/)).toHaveLength(2);
  expect(screen.getByAltText("Current Question Image")).toBeTruthy();
});

it("keeps remaining pasted answers unchecked when removing an unwanted answer", async () => {
  const user = userEvent.setup();
  render(<QuestionForm action={async () => ({ status: "idle" })} />);
  await user.click(screen.getByLabelText("Norwegian prompt"));
  await user.paste("Hva?\nja\nnei\nkanskje");
  await user.click(screen.getAllByRole("button", { name: "Remove" })[2]);
  expect(screen.getAllByRole("checkbox").every((input) => !(input as HTMLInputElement).checked)).toBe(true);
});

it.each([
  "Norwegian prompt", "English prompt translation", "Norwegian option 1", "English option 1", "Correct option 1",
  "Add option", "Remove", "Move down",
])("expires paste Undo after editing %s", async (control) => {
  const user = userEvent.setup();
  render(<QuestionForm action={async () => ({ status: "idle" })} />);
  await user.click(screen.getByLabelText("Norwegian prompt"));
  await user.paste("Hva?\nja\nnei\nkanskje");
  if (["Add option", "Remove", "Move down"].includes(control)) {
    await user.click(screen.getAllByRole("button", { name: control })[0]);
  } else if (control === "Correct option 1") {
    await user.click(screen.getByLabelText(control));
  } else {
    await user.type(screen.getByLabelText(control), "!");
  }
  expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
});

it.each(["Translate to English", "Save Question", "Save and add another"])("expires Undo before %s and falls back to ordinary paste while pending", async (button) => {
  const user = userEvent.setup();
  let finish!: (value: { status: "failed"; message: string }) => void;
  const action = vi.fn(() => new Promise<{ status: "failed"; message: string }>((resolve) => { finish = resolve; }));
  render(<QuestionForm action={action} />);
  const prompt = screen.getByLabelText<HTMLTextAreaElement>("Norwegian prompt");
  await user.click(prompt);
  await user.paste("Hva?\nja\nnei");
  await user.click(screen.getByRole("button", { name: button }));
  expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  await user.click(prompt);
  prompt.setSelectionRange(0, prompt.value.length);
  await user.paste("Hvem?\ndeg\nmeg");
  expect(prompt.value).toBe("Hvem?\ndeg\nmeg");
  expect(screen.getByLabelText<HTMLInputElement>("Norwegian option 1").value).toBe("ja");
  finish({ status: "failed", message: "Try again" });
  await screen.findByText("Try again");
  expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  expect(prompt.value).toBe("Hvem?\ndeg\nmeg");
});

it.each(["Norwegian option 1", "English option 1"])("preserves mixed blank rows when %s contains text", async (label) => {
  const user = userEvent.setup();
  render(<QuestionForm action={async () => ({ status: "idle" })} />);
  await user.type(screen.getByLabelText(label), "existing");
  await user.click(screen.getByLabelText("Norwegian prompt"));
  await user.paste("Hva?\nja\nnei");
  expect(screen.getAllByLabelText(/Norwegian option/)).toHaveLength(4);
  expect(screen.getByLabelText<HTMLInputElement>(label).value).toBe("existing");
  expect(screen.getByLabelText<HTMLInputElement>("Norwegian option 2").value).toBe("");
  expect(screen.getByLabelText<HTMLInputElement>("Norwegian option 3").value).toBe("ja");
});

it("offers only the latest paste Undo and keeps it when focus or selection changes", async () => {
  const user = userEvent.setup();
  render(<QuestionForm action={async () => ({ status: "idle" })} />);
  const prompt = screen.getByLabelText<HTMLTextAreaElement>("Norwegian prompt");
  await user.click(prompt);
  await user.paste("Hva?\nja\nnei");
  prompt.setSelectionRange(0, prompt.value.length);
  await user.paste("Hvem?\ndeg\nmeg");
  expect(screen.getAllByLabelText(/Norwegian option/)).toHaveLength(4);
  await user.tab();
  await user.click(prompt);
  prompt.setSelectionRange(1, 2);
  await user.tab({ shift: true });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Undo" }));
  await user.keyboard("{Enter}");
  expect(prompt.value).toBe("Hvem?\ndeg\nmeg");
  expect(screen.getAllByLabelText(/Norwegian option/).map((input) => (input as HTMLInputElement).value)).toEqual(["ja", "nei"]);
  expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
});

it("keeps unmatched paste and typed newlines ordinary, expiring a previous Undo", async () => {
  const user = userEvent.setup();
  render(<QuestionForm action={async () => ({ status: "idle" })} />);
  const prompt = screen.getByLabelText<HTMLTextAreaElement>("Norwegian prompt");
  await user.click(prompt);
  await user.paste("Hva?\nja");
  await user.keyboard("{Enter}nei");
  expect(prompt.value).toBe("Hva?\nja\nnei");
  expect(screen.getAllByLabelText(/Norwegian option/)).toHaveLength(2);
  expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  await user.paste("Hvem?\ndeg\nmeg");
  await user.paste("!");
  expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
});

it.each([false, true])("submits appended options with reviewed English and preserved identities (translation failure: %s)", async (failTranslation) => {
  const user = userEvent.setup();
  const existing = questionWithImage();
  const translate = vi.fn(async () => {
    if (failTranslation) throw new Error("Offline");
    return ["New?", "yes", "no"];
  });
  const submissions: FormData[] = [];
  const action = vi.fn(async (_state, data: FormData) => {
    if (data.get("intent") === "translate") {
      expect(data.getAll("correctOptions")).toEqual(["0", "2"]);
      return translateQuizQuestionForm(createQuestionTranslationService({ translate }), existing, data);
    }
    submissions.push(data);
    return { status: "failed" as const, message: "Save failed; try again." };
  });
  render(<QuestionForm action={action} question={existing} />);
  const prompt = screen.getByLabelText<HTMLTextAreaElement>("Norwegian prompt");
  await user.click(prompt);
  prompt.select();
  await user.paste("Nytt?\nja\nnei");
  expect(action).not.toHaveBeenCalled();
  await user.click(screen.getByLabelText("Correct option 3"));
  expect(screen.getByLabelText<HTMLInputElement>("Correct option 3").checked).toBe(true);
  await user.click(screen.getByRole("button", { name: "Translate to English" }));
  await screen.findByText(failTranslation
    ? "Automatic translation is unavailable. Enter or review the English text manually."
    : "English is ready to review. Edit it as needed before saving.");
  expect(translate).toHaveBeenCalledWith(["Nytt?", "ja", "nei"]);
  expect(screen.getByLabelText<HTMLInputElement>("Correct option 3").checked).toBe(true);
  if (failTranslation) {
    await user.type(screen.getByLabelText("English prompt translation"), "New?");
    await user.type(screen.getByLabelText("English option 3"), "yes");
    await user.type(screen.getByLabelText("English option 4"), "no");
  }
  await user.click(screen.getByRole("button", { name: "Save Question" }));
  await screen.findByText("Save failed; try again.");
  const data = submissions[0];
  expect(data.get("promptNorwegian")).toBe("Nytt?");
  expect(data.get("promptEnglish")).toBe("New?");
  expect(data.get("options.0.id")).toBe("option-a");
  expect(data.get("options.1.id")).toBe("option-b");
  expect(data.get("options.2.id")).toBeNull();
  expect(data.getAll("correctOptions")).toEqual(["0", "2"]);
  expect([0, 1, 2, 3].map((i) => data.get(`options.${i}.english`))).toEqual(["water", "fire", "yes", "no"]);
  expect(data.get("translationReviewKey")).toBeTruthy();
  expect(screen.getByLabelText<HTMLInputElement>("English option 4").value).toBe("no");
  expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();

  // Undoing another paste retains the ordinary pasted Norwegian, which needs review.
  await user.click(prompt);
  prompt.select();
  await user.paste("Annet?\nen\nto");
  await user.click(screen.getByRole("button", { name: "Undo" }));
  await user.click(screen.getByRole("button", { name: "Save Question" }));
  await waitFor(() => expect(submissions).toHaveLength(2));
  expect(submissions[1].get("translationReviewKey")).toBe("");
  expect(submissions[1].get("promptNorwegian")).toBe("Annet?\nen\nto");
});


it("leaves unavailable clipboard data and pastes outside the Norwegian prompt alone", async () => {
  const user = userEvent.setup();
  render(<QuestionForm action={async () => ({ status: "idle" })} />);
  expect(fireEvent.paste(screen.getByLabelText("Norwegian prompt"))).toBe(true);
  await user.click(screen.getByLabelText("English prompt translation"));
  await user.paste("Question?\nyes\nno");
  expect(screen.getByLabelText<HTMLTextAreaElement>("English prompt translation").value).toBe("Question?\nyes\nno");
  expect(screen.getAllByLabelText(/Norwegian option/)).toHaveLength(2);
  expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
});

it("keeps prompt English when the extracted prompt is unchanged and retains a selected image through Undo", async () => {
  const user = userEvent.setup();
  render(<QuestionForm action={async () => ({ status: "idle" })} />);
  const prompt = screen.getByLabelText<HTMLTextAreaElement>("Norwegian prompt");
  await user.type(prompt, "Hva?");
  await user.type(screen.getByLabelText("English prompt translation"), "What?");
  const file = new File(["image"], "fjord.png", { type: "image/png" });
  await user.upload(screen.getByLabelText("Question Image"), file);
  await user.click(prompt);
  prompt.select();
  await user.paste("Hva?\nja\nnei");
  expect(screen.getByLabelText<HTMLTextAreaElement>("English prompt translation").value).toBe("What?");
  await user.click(screen.getByRole("button", { name: "Undo" }));
  expect(screen.getByLabelText<HTMLInputElement>("Question Image").files?.[0]).toBe(file);
});
