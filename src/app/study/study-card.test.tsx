// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudyCard, StudySession } from "./study-card";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("study card", () => {
  it("waits for a saved milestone after a pending and failed attempt, then retries once", async () => {
    let rejectSave!: (reason: Error) => void;
    const action = vi.fn<(data: FormData) => Promise<{ flashcardId: string; recallStreak: number }>>()
      .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSave = reject; }))
      .mockResolvedValue({ flashcardId: "card-0", recallStreak: 3 });
    render(<StudySession action={action}
      cards={[{ ...weightedCardsForStudy()[0], recallStreak: 2 }]}
      initialAttemptId="attempt-0" initialCardId="card-0" random={() => 0} />);
    await userEvent.click(screen.getByRole("button", { name: "Reveal English Back" }));
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    expect(screen.getByRole("button", { name: "Correct" })).toHaveProperty("disabled", true);
    expect(screen.queryByText("Flashcard learned: null")).toBeNull();
    await act(async () => rejectSave(new Error("offline")));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByText("Flashcard learned: null")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    expect(screen.getAllByText("Flashcard learned: null")).toHaveLength(1);
    expect(action.mock.calls[0][0].get("attemptId")).toBe(action.mock.calls[1][0].get("attemptId"));
    expect(screen.getByRole("button", { name: "Reveal English Back" })).toBeTruthy();
  });

  it.each([
    [0, 1, "Correct"], [1, 2, "Correct"], [3, 3, "Correct"], [2, 0, "Incorrect"],
  ] as const)("does not announce a saved streak %s → %s after %s", async (before, after, assessment) => {
    render(<StudySession action={async () => ({ flashcardId: "card-0", recallStreak: after })}
      cards={[{ ...weightedCardsForStudy()[0], recallStreak: before }]}
      initialAttemptId="attempt-0" initialCardId="card-0" random={() => 0} />);
    expect(screen.queryByText("Flashcard learned: null")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Reveal English Back" }));
    await userEvent.click(screen.getByRole("button", { name: assessment }));
    expect(screen.queryByText("Flashcard learned: null")).toBeNull();
    expect(screen.getByRole("button", { name: "Reveal English Back" })).toBeTruthy();
  });

  it("announces a new milestone after a streak reset and three more correct results", async () => {
    const action = vi.fn<(data: FormData) => Promise<{ flashcardId: string; recallStreak: number }>>();
    for (const recallStreak of [3, 0, 1, 2, 3]) {
      action.mockResolvedValueOnce({ flashcardId: "card-0", recallStreak });
    }
    render(<StudySession action={action}
      cards={[{ ...weightedCardsForStudy()[0], recallStreak: 2 }]}
      initialAttemptId="attempt-0" initialCardId="card-0" random={() => 0} />);
    for (const [index, assessment] of ["Correct", "Incorrect", "Correct", "Correct", "Correct"].entries()) {
      await userEvent.click(screen.getByRole("button", { name: "Reveal English Back" }));
      await userEvent.click(screen.getByRole("button", { name: assessment }));
      if (index === 0 || index === 4) {
        expect(screen.getByText("Flashcard learned: null")).toBeTruthy();
        await userEvent.click(screen.getByRole("button", { name: "Dismiss learned flashcard notification" }));
      } else {
        expect(screen.queryByText("Flashcard learned: null")).toBeNull();
      }
    }
  });

  it("lets the Learner dismiss a toast and does not repeat it for an already Learned card", async () => {
    render(<StudySession action={async () => ({ flashcardId: "card-0", recallStreak: 3 })}
      cards={[{ ...weightedCardsForStudy()[0], recallStreak: 2 }]}
      initialAttemptId="attempt-0" initialCardId="card-0" random={() => 0} />);
    await userEvent.click(screen.getByRole("button", { name: "Reveal English Back" }));
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss learned flashcard notification" }));
    expect(screen.queryByText("Flashcard learned: null")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Reveal English Back" }));
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    expect(screen.queryByText("Flashcard learned: null")).toBeNull();
  });

  it("dismisses the toast after six seconds without interrupting the next card", async () => {
    render(<StudySession action={async () => ({ flashcardId: "card-0", recallStreak: 3 })}
      cards={weightedCardsForStudy().map((card) => ({ ...card, recallStreak: 2 }))}
      initialAttemptId="attempt-0" initialCardId="card-0" random={() => 0} />);
    await userEvent.click(screen.getByRole("button", { name: "Reveal English Back" }));
    vi.useFakeTimers();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Correct" })); });
    expect(screen.getByText("Flashcard learned: null")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reveal English Back" }));
    await act(async () => vi.advanceTimersByTime(6000));
    expect(screen.queryByText("Flashcard learned: null")).toBeNull();
    expect(screen.getByText("one")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Correct" })).toBeTruthy();
  });

  it("announces the learned Flashcard while advancing automatically to the next card", async () => {
    render(<StudySession action={async () => ({ flashcardId: "card-0", recallStreak: 3 })}
      cards={weightedCardsForStudy().map((card) => ({ ...card, recallStreak: 2 }))}
      initialAttemptId="attempt-0" initialCardId="card-0" random={() => 0} />);
    expect(screen.queryByText("Answered correctly 3 times in a row. Now learned!")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Reveal English Back" }));
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));

    const toast = screen.getByRole("status");
    expect(within(toast).getByText("Flashcard learned: null")).toBeTruthy();
    expect(within(toast).getByText("Answered correctly 3 times in a row. Now learned!")).toBeTruthy();
    expect(screen.getByText("én")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reveal English Back" })).toBeTruthy();
    expect(toast.contains(document.activeElement)).toBe(false);
  });

  it("updates Deck Progress only after a saved result and keeps studying at 100%", async () => {
    let resolveSave!: (value: { flashcardId: string; recallStreak: number }) => void;
    const action = vi.fn<(data: FormData) => Promise<{ flashcardId: string; recallStreak: number }>>()
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSave = resolve; }))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ flashcardId: "card-0", recallStreak: 0 })
      .mockResolvedValueOnce({ flashcardId: "card-0", recallStreak: 1 });
    render(<StudySession action={action}
      cards={[{ ...weightedCardsForStudy()[0], recallStreak: 2 }]}
      initialAttemptId="attempt-0" initialCardId="card-0" random={() => 0} />);
    expect(screen.getByText("0% Learned")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Reveal English Back" }));
    expect(screen.getByText("0% Learned")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    expect(screen.getByText("0% Learned")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Correct" })).toHaveProperty("disabled", true);
    await act(async () => resolveSave({ flashcardId: "card-0", recallStreak: 3 }));
    expect(screen.getByText("100% Learned")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Reveal English Back" }));
    await userEvent.click(screen.getByRole("button", { name: "Incorrect" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("100% Learned")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Incorrect" }));
    expect(await screen.findByText("0% Learned")).toBeTruthy();
    expect(action.mock.calls[1][0].get("attemptId")).toBe(action.mock.calls[2][0].get("attemptId"));
    await userEvent.click(screen.getByRole("button", { name: "Reveal English Back" }));
    await userEvent.click(screen.getByRole("button", { name: "Correct" }));
    expect(screen.getByText("0% Learned")).toBeTruthy();
  });

  it("shows rounded Deck Progress across cards not yet studied", () => {
    render(
      <StudySession
        action={vi.fn()}
        cards={[0, 2, 3].map((recallStreak, index) => ({
          id: String(index), deckId: "deck-a", front: "front", back: "back", recallStreak,
        }))}
        initialAttemptId="attempt-0"
        initialCardId="0"
      />,
    );
    expect(screen.getByText("33% Learned")).toBeTruthy();
  });

  it("continues with an eligible Flashcard after an Incorrect result", async () => {
    const action = vi.fn(async (formData: FormData) => ({
      flashcardId: formData.get("flashcardId") as string,
      recallStreak: 0,
    }));
    render(
      <StudySession
        action={action}
        cards={[
          { id: "card-0", deckId: "deck-a", front: "null", back: "zero", recallStreak: 0 },
          { id: "card-1", deckId: "deck-a", front: "én", back: "one", recallStreak: 0 },
          { id: "card-2", deckId: "deck-a", front: "to", back: "two", recallStreak: 0 },
          { id: "card-3", deckId: "deck-a", front: "tre", back: "three", recallStreak: 0 },
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
          deckId: "deck-a",
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
          deckId: "deck-a",
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
    { id: "card-0", deckId: "deck-a", front: "null", back: "zero", recallStreak: 0 },
    { id: "card-1", deckId: "deck-a", front: "én", back: "one", recallStreak: 0 },
  ];
}
