// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteCollectionForm } from "./delete-collection-form";

afterEach(cleanup);

describe("Delete Collection form", () => {
  it("shows the active item count and submits only after confirmation", async () => {
    const action = vi.fn(async () => ({ status: "idle" as const }));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <DeleteCollectionForm
        action={action}
        collectionType="Quiz"
        itemCount={3}
        itemName="Question"
      />,
    );

    expect(screen.getByText("This Quiz contains 3 active Questions.")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Delete Quiz" }));
    expect(confirm).toHaveBeenCalledWith(
      "Delete this Quiz and its 3 active Questions permanently?",
    );
    expect(action).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole("button", { name: "Delete Quiz" }));
    expect(action).toHaveBeenCalledOnce();
  });

  it("announces a concise deletion failure", async () => {
    const action = async (): Promise<import("./delete-collection-form").DeleteCollectionFormState> => ({
      status: "failed",
      message: "Quiz could not be deleted. Refresh and try again.",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <DeleteCollectionForm
        action={action}
        collectionType="Quiz"
        itemCount={1}
        itemName="Question"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Delete Quiz" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Quiz could not be deleted. Refresh and try again.",
    );
  });
});
