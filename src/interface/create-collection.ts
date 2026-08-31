import {
  CollectionNameConflictError,
  CollectionNameValidationError,
  type createCollectionService,
} from "../application/collections";

type CollectionService = ReturnType<typeof createCollectionService>;

export type CreateCollectionFormState =
  | { status: "idle" }
  | {
      status: "invalid";
      fieldErrors: { name?: string };
      values: { name: string };
    }
  | { status: "created"; collectionId: string };

export async function submitCreateCollectionForm(
  collections: Pick<CollectionService, "create">,
  _collectionType: "Flashcard Deck" | "Quiz",
  formData: FormData,
): Promise<CreateCollectionFormState> {
  const submittedName = formData.get("name");
  const values = { name: typeof submittedName === "string" ? submittedName : "" };

  try {
    const created = await collections.create(values);
    return { status: "created", collectionId: created.id };
  } catch (error) {
    if (
      error instanceof CollectionNameValidationError ||
      error instanceof CollectionNameConflictError
    ) {
      return { status: "invalid", fieldErrors: error.fieldErrors, values };
    }
    throw error;
  }
}
