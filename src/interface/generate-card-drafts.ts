import {
  SourceTextValidationError,
  type createGenerationService,
} from "../application/generation";

type GenerationService = ReturnType<typeof createGenerationService>;

export type GenerationFormState =
  | { status: "idle" }
  | {
      status: "invalid";
      fieldErrors: { sourceText: string };
      values: { sourceText: string };
    }
  | { status: "generated"; sourceTextId: string };

export async function submitGenerationForm(
  generation: Pick<GenerationService, "generate">,
  formData: FormData,
): Promise<GenerationFormState> {
  const formValue = formData.get("sourceText");
  const sourceText = typeof formValue === "string" ? formValue : "";

  try {
    const completed = await generation.generate(sourceText);
    return { status: "generated", sourceTextId: completed.id };
  } catch (error) {
    if (error instanceof SourceTextValidationError) {
      return {
        status: "invalid",
        fieldErrors: error.fieldErrors,
        values: { sourceText },
      };
    }

    throw error;
  }
}
