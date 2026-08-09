import {
  FlashcardValidationError,
  type createFlashcardService,
} from "../application/flashcards";

type FlashcardService = ReturnType<typeof createFlashcardService>;

export type EditFlashcardFormState =
  | { status: "idle" }
  | {
      status: "invalid";
      fieldErrors: { front?: string; back?: string };
      values: { front: string; back: string };
    }
  | { status: "updated" };

export async function submitEditFlashcardForm(
  flashcards: Pick<FlashcardService, "update">,
  id: string,
  formData: FormData,
): Promise<EditFlashcardFormState> {
  const front = formData.get("front");
  const back = formData.get("back");
  const values = {
    front: typeof front === "string" ? front : "",
    back: typeof back === "string" ? back : "",
  };

  try {
    await flashcards.update(id, values);
  } catch (error) {
    if (error instanceof FlashcardValidationError) {
      return {
        status: "invalid",
        fieldErrors: error.fieldErrors,
        values,
      };
    }

    throw error;
  }

  return { status: "updated" };
}
