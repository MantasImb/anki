// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteQuestionForm } from "./delete-question-form";

afterEach(cleanup);

describe("Delete Question form", () => {
  it("cancels or confirms permanent Question deletion", async () => {
    const action = vi.fn(async () => ({ status: "idle" as const }));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteQuestionForm action={action} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete Question" }));
    expect(action).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole("button", { name: "Delete Question" }));
    expect(action).toHaveBeenCalledOnce();
  });

  it("announces a concise deletion failure", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <DeleteQuestionForm
        action={async () => ({
          status: "failed",
          message: "Question could not be deleted. Refresh and try again.",
        })}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Delete Question" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Question could not be deleted. Refresh and try again.",
    );
  });
});
