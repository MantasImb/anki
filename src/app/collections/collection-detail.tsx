import Link from "next/link";
import type { Collection } from "@/application/collections";

export function CollectionDetail({
  collection,
  collectionType,
}: {
  collection: Collection;
  collectionType: "Flashcard Deck" | "Quiz";
}) {
  const isDeck = collectionType === "Flashcard Deck";
  const basePath = isDeck ? `/decks/${collection.id}` : `/quizzes/${collection.id}`;
  const addPath = isDeck ? `${basePath}/cards/new` : `${basePath}/questions/new`;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        {collectionType}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {collection.name}
      </h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800"
          href={addPath}
        >
          {isDeck ? "Add Flashcard" : "Add Question"}
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50"
          href={`${basePath}/study`}
        >
          {isDeck ? "Study Deck" : "Study Quiz"}
        </Link>
      </div>
      <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
        <h2 className="text-xl font-semibold text-slate-950">
          {isDeck ? "No cards yet" : "No questions yet"}
        </h2>
        <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
          {isDeck
            ? "Add a Norwegian Front and English Back to this Deck."
            : "Add a Norwegian Quiz Question and Answer Options to this Quiz."}
        </p>
      </section>
    </main>
  );
}
