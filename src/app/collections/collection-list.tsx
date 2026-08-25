import Link from "next/link";
import type { Collection } from "@/application/collections";

export function CollectionList({
  basePath,
  collections,
}: {
  basePath: "/decks" | "/quizzes";
  collections: Collection[];
}) {
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {collections.map((collection) => (
        <li key={collection.id}>
          <Link
            className="flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-lg font-semibold text-slate-950 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
            href={`${basePath}/${collection.id}`}
          >
            {collection.name}
            <span aria-hidden="true" className="text-sky-700">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
