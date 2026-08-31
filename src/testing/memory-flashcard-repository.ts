import type {
  Flashcard,
  FlashcardContent,
  FlashcardRepository,
  NewFlashcard,
} from "../application/flashcards";

export class MemoryFlashcardRepository implements FlashcardRepository {
  private flashcards: Flashcard[] = [];

  async create(input: NewFlashcard): Promise<Flashcard> {
    const flashcard: Flashcard = {
      id: crypto.randomUUID(),
      ...input,
      recallStreak: 0,
    };

    this.flashcards.push(flashcard);
    return flashcard;
  }

  async delete(deckId: string, id: string): Promise<boolean> {
    const originalLength = this.flashcards.length;
    this.flashcards = this.flashcards.filter(
      (flashcard) => flashcard.id !== id || flashcard.deckId !== deckId,
    );
    return this.flashcards.length < originalLength;
  }

  async get(deckId: string, id: string): Promise<Flashcard | undefined> {
    return this.flashcards.find(
      (flashcard) => flashcard.id === id && flashcard.deckId === deckId,
    );
  }

  async list(deckId: string): Promise<Flashcard[]> {
    return this.flashcards.filter((flashcard) => flashcard.deckId === deckId);
  }

  async update(
    deckId: string,
    id: string,
    input: FlashcardContent,
  ): Promise<Flashcard | undefined> {
    const index = this.flashcards.findIndex(
      (flashcard) => flashcard.id === id && flashcard.deckId === deckId,
    );

    if (index === -1) {
      return undefined;
    }

    const updated = { ...this.flashcards[index], ...input };

    this.flashcards[index] = updated;
    return updated;
  }
}
