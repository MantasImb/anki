// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { CreateCollectionFormState } from "@/interface/create-collection";
import { CreateCollectionForm } from "./create-collection-form";

afterEach(cleanup);

describe("Create collection form", () => {
  it("announces a duplicate Quiz name and preserves the submitted value", async () => {
    const rejectDuplicate = async (
      _state: CreateCollectionFormState,
      formData: FormData,
    ): Promise<CreateCollectionFormState> => ({
      status: "invalid",
      fieldErrors: { name: "A Quiz with this name already exists." },
      values: { name: String(formData.get("name")) },
    });
    render(
      <CreateCollectionForm
        action={rejectDuplicate}
        collectionType="Quiz"
      />,
    );

    await userEvent.type(screen.getByLabelText("Quiz name"), "På vei");
    await userEvent.click(screen.getByRole("button", { name: "Create Quiz" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "A Quiz with this name already exists.",
    );
    expect((screen.getByLabelText("Quiz name") as HTMLInputElement).value).toBe(
      "På vei",
    );
  });
});
