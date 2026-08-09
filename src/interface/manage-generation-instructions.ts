import {
  GenerationInstructionsValidationError,
  type createGenerationInstructionsService,
} from "../application/generation-instructions";

type GenerationInstructionsService = ReturnType<
  typeof createGenerationInstructionsService
>;

export type GenerationInstructionsFormState =
  | { status: "idle"; values: { instructions: string } }
  | { status: "saved"; values: { instructions: string } }
  | {
      status: "invalid";
      fieldErrors: { instructions: string };
      values: { instructions: string };
    };

export async function submitGenerationInstructionsForm(
  service: Pick<GenerationInstructionsService, "save">,
  formData: FormData,
): Promise<GenerationInstructionsFormState> {
  const value = formData.get("instructions");
  const instructions = typeof value === "string" ? value : "";

  try {
    const saved = await service.save(instructions);
    return { status: "saved", values: { instructions: saved } };
  } catch (error) {
    if (error instanceof GenerationInstructionsValidationError) {
      return {
        status: "invalid",
        fieldErrors: error.fieldErrors,
        values: { instructions },
      };
    }

    throw error;
  }
}
