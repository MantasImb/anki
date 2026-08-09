// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EditFlashcardFormState } from "@/interface/maintain-flashcard";
import {
  DeleteFlashcardForm,
  EditFlashcardForm,
} from "./edit-flashcard-form";

afterEach(cleanup);

describe("Edit Flashcard form", () => {
  it("shows the Flashcard's current Front and Back", () => {
    const update = async (): Promise<EditFlashcardFormState> => ({
      status: "updated",
    });

    render(
      <EditFlashcardForm
        action={update}
        flashcard={{
          id: "card-id",
          front: "Jeg kjører drosje.",
          back: "I drive a taxi.",
          recallStreak: 0,
        }}
      />,
    );

    expect(screen.getByLabelText("Norwegian Front")).toHaveProperty(
      "value",
      "Jeg kjører drosje.",
    );
    expect(screen.getByLabelText("English Back")).toHaveProperty(
      "value",
      "I drive a taxi.",
    );
  });

  it("announces an invalid edit and identifies the affected field", async () => {
    const rejectInvalidEdit = async (): Promise<EditFlashcardFormState> => ({
      status: "invalid",
      fieldErrors: { front: "Enter a Norwegian Front." },
      values: { front: "", back: "I drive a taxi." },
    });
    render(
      <EditFlashcardForm
        action={rejectInvalidEdit}
        flashcard={{
          id: "card-id",
          front: "Jeg kjører drosje.",
          back: "I drive a taxi.",
          recallStreak: 0,
        }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Flashcard was not updated",
    );
    expect(screen.getByText("Enter a Norwegian Front.")).toBeTruthy();
    expect(
      screen.getByLabelText("Norwegian Front").getAttribute("aria-invalid"),
    ).toBe("true");
  });
});

describe("Delete Flashcard form", () => {
  it("requires confirmation before submitting deletion", async () => {
    const deleteAction = vi.fn(async () => undefined);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteFlashcardForm action={deleteAction} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Delete Flashcard" }),
    );
    expect(deleteAction).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await userEvent.click(
      screen.getByRole("button", { name: "Delete Flashcard" }),
    );
    expect(deleteAction).toHaveBeenCalledOnce();
  });
});
