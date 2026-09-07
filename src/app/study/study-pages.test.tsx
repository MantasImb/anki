// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import DeckStudyPage from "../decks/[id]/study/page";
import QuizStudyPage from "../quizzes/[id]/study/page";

vi.mock("@/composition/collections", () => ({
  getFlashcardDeckService: () => ({ get: async () => ({ id: "deck", name: "Deck" }) }),
  getQuizService: () => ({ get: async () => ({ id: "quiz", name: "Quiz" }) }),
}));
vi.mock("@/composition/study", () => ({
  getStudyService: () => ({ cards: async () => [] }),
}));
vi.mock("@/composition/quiz-study", () => ({
  getQuizStudyService: () => ({ questions: async () => [] }),
}));
vi.mock("@/composition/question-images", () => ({ getQuestionImageService: vi.fn() }));
vi.mock("../decks/[id]/study/actions", () => ({ recordDeckStudyAssessment: vi.fn() }));
vi.mock("../quizzes/[id]/study/actions", () => ({
  recordQuizStudyAnswer: vi.fn(), refreshQuizQuestionImage: vi.fn(),
}));

afterEach(cleanup);

it.each([
  ["Flashcards", DeckStudyPage],
  ["Questions", QuizStudyPage],
] as const)("keeps the empty %s study page without a learned percentage", async (kind, Page) => {
  render(await Page({ params: Promise.resolve({ id: "empty" }) }));
  expect(screen.getByRole("heading", { name: `No ${kind} to study` })).toBeTruthy();
  expect(screen.queryByText(/% Learned/)).toBeNull();
});
