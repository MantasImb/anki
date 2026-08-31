import type {
  Collection,
  CollectionRepository,
} from "../application/collections";

export class MemoryCollectionRepository implements CollectionRepository {
  private readonly collections: Array<Collection & { nameKey: string }> = [];
  private readonly nameKeys = new Set<string>();

  async create(input: Collection & { nameKey: string }) {
    if (this.nameKeys.has(input.nameKey)) {
      return undefined;
    }
    const collection = { id: input.id, name: input.name };
    this.collections.push({ ...collection, nameKey: input.nameKey });
    this.nameKeys.add(input.nameKey);
    return collection;
  }

  async get(id: string) {
    const collection = this.collections.find((candidate) => candidate.id === id);
    return collection
      ? { id: collection.id, name: collection.name }
      : undefined;
  }

  async list() {
    return this.collections.map(({ id, name }) => ({ id, name }));
  }

  async delete(id: string) {
    const index = this.collections.findIndex((collection) => collection.id === id);
    if (index === -1) return false;
    const [deleted] = this.collections.splice(index, 1);
    this.nameKeys.delete(deleted.nameKey);
    return true;
  }
}
