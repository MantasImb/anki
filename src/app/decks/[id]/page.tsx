import { notFound } from "next/navigation";
import { CollectionDetail } from "@/app/collections/collection-detail";
import { getFlashcardDeckService } from "@/composition/collections";

export const dynamic = "force-dynamic";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deck = await getFlashcardDeckService().get(id);
  if (!deck) notFound();
  return <CollectionDetail collection={deck} collectionType="Flashcard Deck" />;
}
