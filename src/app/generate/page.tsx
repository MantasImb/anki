import Link from "next/link";
import { getGenerationFormConfiguration } from "@/composition/generation";
import { generateCardDrafts } from "./actions";
import { GenerationForm } from "./generation-form";

export default function GeneratePage() {
  const { maximumSourceTextCharacters } = getGenerationFormConfiguration();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-sky-700 hover:text-sky-900"
        href="/"
      >
        ← Dashboard
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Generate learning material
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Create Card Drafts
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Turn Norwegian curriculum material into Norwegian Front and English
        Back suggestions. Nothing enters your Flashcard collection until a
        later review step.
      </p>
      <GenerationForm
        action={generateCardDrafts}
        maximumCharacters={maximumSourceTextCharacters}
      />
    </main>
  );
}
