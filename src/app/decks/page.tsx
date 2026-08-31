import { getFlashcardDeckService } from "@/composition/collections";
import { CollectionIndex } from "../collections/collection-index";
import { createDeck } from "./actions";

export const dynamic = "force-dynamic";

export default async function DecksPage() {
  const decks = await getFlashcardDeckService().list();
  return (
    <CollectionIndex
      action={createDeck}
      basePath="/decks"
      collections={decks}
      collectionType="Flashcard Deck"
    />
  );
}
