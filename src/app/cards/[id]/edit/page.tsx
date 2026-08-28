import { redirect } from "next/navigation";

export default async function EditFlashcardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/decks");
}
