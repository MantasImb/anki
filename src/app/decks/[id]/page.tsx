import { notFound } from "next/navigation";
import { getFlashcardDeckService } from "@/composition/collections";
import { getFlashcardService } from "@/composition/flashcards";
import { DeckDetail } from "../deck-detail";

export const dynamic = "force-dynamic";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [deck, flashcards] = await Promise.all([
    getFlashcardDeckService().get(id),
    getFlashcardService().list(id),
  ]);
  if (!deck) notFound();
  return <DeckDetail deck={deck} flashcards={flashcards} />;
}
