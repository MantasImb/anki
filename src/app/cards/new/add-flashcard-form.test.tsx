// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { AddFlashcardFormState } from "@/interface/add-flashcard";
import { AddFlashcardForm } from "./add-flashcard-form";

afterEach(cleanup);

describe("Add Flashcard form", () => {
  it("announces a rejected submission while preserving field errors", async () => {
    const rejectEmptySubmission = async (): Promise<AddFlashcardFormState> => ({
      status: "invalid",
      fieldErrors: {
        front: "Enter a Norwegian Front.",
        back: "Enter an English Back.",
      },
      values: { front: "", back: "" },
    });
    render(<AddFlashcardForm action={rejectEmptySubmission} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Save Flashcard" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Flashcard was not saved");
    expect(screen.getByText("Enter a Norwegian Front.")).toBeTruthy();
    expect(screen.getByText("Enter an English Back.")).toBeTruthy();
  });
});
