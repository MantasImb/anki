import {
  CardDraftUnavailableError,
  CardDraftValidationError,
  type createCardDraftReviewService,
} from "../application/draft-review";

type CardDraftReviewService = ReturnType<typeof createCardDraftReviewService>;

export type CardDraftReviewFormState =
  | { status: "idle" }
  | {
      status: "invalid";
      fieldErrors: { front?: string; back?: string };
      values: { front: string; back: string };
    }
  | { status: "saved" | "approved" | "rejected" | "unavailable" };

export async function submitCardDraftReview(
  reviews: Pick<CardDraftReviewService, "update" | "approve" | "reject">,
  sourceTextId: string,
  formData: FormData,
): Promise<CardDraftReviewFormState> {
  const id = formData.get("draftId");
  const intent = formData.get("intent");
  const front = formData.get("front");
  const back = formData.get("back");
  const values = {
    front: typeof front === "string" ? front : "",
    back: typeof back === "string" ? back : "",
  };

  if (typeof id !== "string" || !id) {
    return { status: "unavailable" };
  }

  try {
    if (intent === "save") {
      await reviews.update(sourceTextId, id, values);
      return { status: "saved" };
    }

    if (intent === "approve") {
      await reviews.approve(sourceTextId, id, values);
      return { status: "approved" };
    }

    if (intent === "reject") {
      await reviews.reject(sourceTextId, id);
      return { status: "rejected" };
    }

    return { status: "unavailable" };
  } catch (error) {
    if (error instanceof CardDraftValidationError) {
      return {
        status: "invalid",
        fieldErrors: error.fieldErrors,
        values,
      };
    }

    if (error instanceof CardDraftUnavailableError) {
      return { status: "unavailable" };
    }

    throw error;
  }
}
