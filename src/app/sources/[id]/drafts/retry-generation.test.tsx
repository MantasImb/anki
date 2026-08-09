// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RetryGenerationState } from "@/interface/retry-generation";
import { RetryGeneration } from "./retry-generation";

afterEach(cleanup);

describe("Retry generation", () => {
  it("communicates progress and prevents duplicate retries", async () => {
    let finish!: (state: RetryGenerationState) => void;
    const action = vi.fn(
      () =>
        new Promise<RetryGenerationState>((resolve) => {
          finish = resolve;
        }),
    );
    render(<RetryGeneration action={action} />);

    await userEvent.click(screen.getByRole("button", { name: "Try Again" }));

    const pending = await screen.findByRole("button", {
      name: "Trying Again…",
    });
    expect(pending.hasAttribute("disabled")).toBe(true);
    await userEvent.click(pending);
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => finish({ status: "failed" }));
  });
});
