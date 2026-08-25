import type {
  Collection,
  CollectionRepository,
} from "../application/collections";

export class MemoryCollectionRepository implements CollectionRepository {
  private readonly collections: Collection[] = [];
  private readonly nameKeys = new Set<string>();

  async create(input: Collection & { nameKey: string }) {
    if (this.nameKeys.has(input.nameKey)) {
      return undefined;
    }
    const collection = { id: input.id, name: input.name };
    this.collections.push(collection);
    this.nameKeys.add(input.nameKey);
    return collection;
  }

  async get(id: string) {
    return this.collections.find((collection) => collection.id === id);
  }

  async list() {
    return [...this.collections];
  }
}
