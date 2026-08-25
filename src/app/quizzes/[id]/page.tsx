import { notFound } from "next/navigation";
import { CollectionDetail } from "@/app/collections/collection-detail";
import { getQuizService } from "@/composition/collections";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuizService().get(id);
  if (!quiz) notFound();
  return <CollectionDetail collection={quiz} collectionType="Quiz" />;
}
