// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudyCard, StudySession } from "./study-card";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("study card", () => {
  it("continues with an eligible Flashcard after an Incorrect result", async () => {
    const action = vi.fn(async (formData: FormData) => ({
      flashcardId: formData.get("flashcardId") as string,
      recallStreak: 0,
    }));
    render(
      <StudySession
        action={action}
        cards={[
          { id: "card-0", front: "null", back: "zero", recallStreak: 0 },
          { id: "card-1", front: "én", back: "one", recallStreak: 0 },
          { id: "card-2", front: "to", back: "two", recallStreak: 0 },
          { id: "card-3", front: "tre", back: "three", recallStreak: 0 },
        ]}
        initialAttemptId="attempt-0"
        initialCardId="card-0"
        random={() => 0}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Reveal English Back" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Incorrect" }));

    expect(await screen.findByText("én")).toBeTruthy();
    expect(screen.queryByText("null")).toBeNull();
  });

  it("keeps the current Flashcard available when recording fails", async () => {
    const action = vi.fn(async () => {
      throw new Error("network unavailable");
    });
    render(
      <StudySession
        action={action}
        cards={weightedCardsForStudy()}
        initialAttemptId="attempt-0"
        initialCardId="card-0"
        random={() => 0}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Reveal English Back" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Incorrect" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not record this result. Try again.",
    );
    expect(screen.getByText("null")).toBeTruthy();
    expect(screen.getByText("zero")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Incorrect" })).toBeTruthy();
  });

  it("creates a UUID-shaped next attempt when randomUUID is unavailable", async () => {
    vi.stubGlobal("crypto", {});
    const action = vi.fn(async (formData: FormData) => ({
      flashcardId: formData.get("flashcardId") as string,
      recallStreak: 1,
    }));
    render(
      <StudySession
        action={action}
        cards={weightedCardsForStudy().slice(0, 1)}
        initialAttemptId="attempt-0"
        initialCardId="card-0"
        random={() => 0}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Reveal English Back" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Reveal English Back" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));

    const secondAttempt = action.mock.calls[1][0].get("attemptId");
    expect(secondAttempt).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

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

function weightedCardsForStudy() {
  return [
    { id: "card-0", front: "null", back: "zero", recallStreak: 0 },
    { id: "card-1", front: "én", back: "one", recallStreak: 0 },
  ];
}
