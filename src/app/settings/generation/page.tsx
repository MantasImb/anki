import Link from "next/link";
import { getGenerationInstructionsService } from "@/composition/generation-instructions";
import {
  resetGenerationInstructions,
  saveGenerationInstructions,
} from "./actions";
import { GenerationInstructionsForm } from "./generation-instructions-form";

export default async function GenerationSettingsPage() {
  const instructions = await getGenerationInstructionsService().get();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-sky-700 hover:text-sky-900"
        href="/generate"
      >
        ← Back to generation
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Generation settings
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Generation Instructions
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Tune how Source Text becomes Card Drafts. Saved changes apply on every
        device using this collection.
      </p>
      <GenerationInstructionsForm
        initialInstructions={instructions}
        resetAction={resetGenerationInstructions}
        saveAction={saveGenerationInstructions}
      />
    </main>
  );
}
