// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudyCard } from "./study-card";

afterEach(cleanup);

describe("study card", () => {
  it("reveals the English Back without recording a result", async () => {
    const action = vi.fn(async () => {});
    render(
      <StudyCard
        action={action}
        attemptId="attempt-1"
        flashcard={{
          id: "card-1",
          front: "Jeg kjører drosje.",
          back: "I drive a taxi.",
          recallStreak: 0,
        }}
      />,
    );

    expect(screen.getByText("Jeg kjører drosje.")).toBeTruthy();
    expect(screen.queryByText("I drive a taxi.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Correct" })).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Reveal English Back" }),
    );

    expect(screen.getByText("I drive a taxi.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Correct" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Incorrect" })).toBeTruthy();
    expect(action).not.toHaveBeenCalled();
  });

  it("submits one self-assessment for the shown attempt", async () => {
    const action = vi.fn(async () => {});
    render(
      <StudyCard
        action={action}
        attemptId="attempt-1"
        flashcard={{
          id: "card-1",
          front: "Jeg kjører drosje.",
          back: "I drive a taxi.",
          recallStreak: 0,
        }}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Reveal English Back" }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Correct" }));

    expect(action).toHaveBeenCalledTimes(1);
    const submitted = action.mock.calls[0][0];
    expect(Object.fromEntries(submitted)).toMatchObject({
      attemptId: "attempt-1",
      flashcardId: "card-1",
      assessment: "correct",
    });
  });
});
