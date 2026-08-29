import { notFound } from "next/navigation";
import { QuizDetail } from "@/app/quizzes/quiz-detail";
import { getQuizService } from "@/composition/collections";
import { getQuizQuestionService } from "@/composition/quiz-questions";
import { getQuestionImageService } from "@/composition/question-images";

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
  const images = questions.some(({ image }) => image)
    ? getQuestionImageService()
    : undefined;
  const displayQuestions = await Promise.all(questions.map(async (question) => ({
    ...question,
    ...(question.image && images
      ? { imageUrl: await images.readUrl(question.image) }
      : {}),
  })));
  return <QuizDetail quiz={quiz} questions={displayQuestions} />;
}
