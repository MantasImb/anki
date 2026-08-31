export type Collection = {
  id: string;
  name: string;
};

export type NewCollection = {
  name: string;
};

export interface CollectionRepository {
  create(
    input: Collection & { nameKey: string },
  ): Promise<Collection | undefined>;
  get(id: string): Promise<Collection | undefined>;
  list(): Promise<Collection[]>;
  delete(id: string): Promise<boolean>;
}

export class CollectionNotFoundError extends Error {
  constructor() {
    super("Collection was not found.");
    this.name = "CollectionNotFoundError";
  }
}

export class CollectionNameValidationError extends Error {
  readonly fieldErrors: { name: string };

  constructor(collectionType: "Flashcard Deck" | "Quiz") {
    super("Collection Name is invalid.");
    this.name = "CollectionNameValidationError";
    this.fieldErrors = { name: `Enter a ${collectionType} name.` };
  }
}

export class CollectionNameConflictError extends Error {
  readonly fieldErrors: { name: string };

  constructor(collectionType: "Flashcard Deck" | "Quiz") {
    super("Collection Name is already in use.");
    this.name = "CollectionNameConflictError";
    this.fieldErrors = {
      name: `A ${collectionType} with this name already exists.`,
    };
  }
}

function normalizeDisplayName(name: string) {
  return name.trim().replace(/\s+/gu, " ");
}

export function createCollectionService(
  collectionType: "Flashcard Deck" | "Quiz",
  repository: CollectionRepository,
  cleanup: () => Promise<unknown> = async () => undefined,
) {
  return {
    async create(input: NewCollection) {
      const name = normalizeDisplayName(input.name);
      if (!name) {
        throw new CollectionNameValidationError(collectionType);
      }
      const created = await repository.create({
        id: crypto.randomUUID(),
        name,
        nameKey: name.toLocaleLowerCase("nb-NO"),
      });
      if (!created) {
        throw new CollectionNameConflictError(collectionType);
      }
      return created;
    },
    get(id: string) {
      return repository.get(id);
    },
    list() {
      return repository.list();
    },
    async delete(id: string) {
      if (!await repository.delete(id)) {
        throw new CollectionNotFoundError();
      }
      try {
        await cleanup();
      } catch {
        // The committed deletion is authoritative; queued cleanup retries later.
      }
    },
  };
}
