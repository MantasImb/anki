import { notFound } from "next/navigation";
import { QuizDetail } from "@/app/quizzes/quiz-detail";
import { getQuizService } from "@/composition/collections";
import { getQuizQuestionService } from "@/composition/quiz-questions";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuizService().get(id);
  if (!quiz) notFound();
  const questions = await getQuizQuestionService().list(id);
  return <QuizDetail quiz={quiz} questions={questions} />;
}
