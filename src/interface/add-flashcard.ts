import {
  FlashcardValidationError,
  type createFlashcardService,
} from "../application/flashcards";

type FlashcardService = ReturnType<typeof createFlashcardService>;

export type AddFlashcardFormState =
  | { status: "idle" }
  | {
      status: "invalid";
      fieldErrors: {
        front?: string;
        back?: string;
      };
      values: {
        front: string;
        back: string;
      };
    }
  | { status: "created" };

export async function submitAddFlashcardForm(
  flashcards: Pick<FlashcardService, "create">,
  deckId: string,
  formData: FormData,
): Promise<AddFlashcardFormState> {
  const front = formData.get("front");
  const back = formData.get("back");
  const values = {
    front: typeof front === "string" ? front : "",
    back: typeof back === "string" ? back : "",
  };

  try {
    await flashcards.create({ deckId, ...values });
    return { status: "created" };
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
}
