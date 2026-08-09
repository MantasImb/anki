import type {
  Flashcard,
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

  async delete(id: string): Promise<boolean> {
    const originalLength = this.flashcards.length;
    this.flashcards = this.flashcards.filter(
      (flashcard) => flashcard.id !== id,
    );
    return this.flashcards.length < originalLength;
  }

  async get(id: string): Promise<Flashcard | undefined> {
    return this.flashcards.find((flashcard) => flashcard.id === id);
  }

  async list(): Promise<Flashcard[]> {
    return [...this.flashcards];
  }

  async update(
    id: string,
    input: NewFlashcard,
  ): Promise<Flashcard | undefined> {
    const index = this.flashcards.findIndex((flashcard) => flashcard.id === id);

    if (index === -1) {
      return undefined;
    }

    const updated = { ...this.flashcards[index], ...input };

    this.flashcards[index] = updated;
    return updated;
  }
}
