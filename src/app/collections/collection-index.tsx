import type { Collection } from "@/application/collections";
import type { CreateCollectionFormState } from "@/interface/create-collection";
import { CollectionList } from "./collection-list";
import { CreateCollectionForm } from "./create-collection-form";

type CreateCollectionAction = (
  state: CreateCollectionFormState,
  formData: FormData,
) => Promise<CreateCollectionFormState>;

export function CollectionIndex({
  action,
  basePath,
  collections,
  collectionType,
}: {
  action: CreateCollectionAction;
  basePath: "/decks" | "/quizzes";
  collections: Collection[];
  collectionType: "Flashcard Deck" | "Quiz";
}) {
  const plural = collectionType === "Quiz" ? "Quizzes" : "Flashcard Decks";
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        Study collections
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {plural}
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Create a named {collectionType} before adding or studying content.
      </p>
      <CreateCollectionForm action={action} collectionType={collectionType} />
      {collections.length > 0 ? (
        <CollectionList basePath={basePath} collections={collections} />
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No {plural.toLowerCase()} yet.
        </p>
      )}
    </main>
  );
}
