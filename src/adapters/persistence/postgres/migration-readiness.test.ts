import { describe, expect, it } from "vitest";
import {
  expectedDatabaseObjects,
  requireCompleteMigrationHistory,
  requireExpectedDatabaseObjects,
  requireFreshV2DatabaseState,
} from "./migration-readiness";
import { DEFAULT_GENERATION_TEMPLATE } from "../../../application/generation";

const expectedMigrations = [
  { tag: "0000_initial", when: 100 },
  { tag: "0001_constraints", when: 200 },
  { tag: "0002_study_history", when: 300 },
];

describe("release migration readiness", () => {
  it("accepts a fresh v2 database with the bundled default instructions", () => {
    expect(() =>
      requireFreshV2DatabaseState({
        effectiveGenerationInstructions: DEFAULT_GENERATION_TEMPLATE,
        rowCounts: {
          answer_options: 0,
          card_drafts: 0,
          flashcard_decks: 0,
          flashcards: 0,
          generation_instructions: 0,
          question_image_cleanup: 0,
          question_image_uploads: 0,
          quizzes: 0,
          quiz_questions: 0,
          quiz_results: 0,
          source_texts: 0,
          study_results: 0,
        },
      }),
    ).not.toThrow();
  });

  it("rejects a release database containing learner or customized state", () => {
    expect(() =>
      requireFreshV2DatabaseState({
        effectiveGenerationInstructions: "customized provider instructions",
        rowCounts: {
          answer_options: 0,
          card_drafts: 0,
          flashcard_decks: 1,
          flashcards: 0,
          generation_instructions: 1,
          question_image_cleanup: 0,
          question_image_uploads: 0,
          quizzes: 0,
          quiz_questions: 0,
          quiz_results: 0,
          source_texts: 0,
          study_results: 0,
        },
      }),
    ).toThrow(
      "Release database is not fresh. Populated tables: flashcard_decks, generation_instructions.",
    );
  });

  it("rejects an empty database whose effective instructions are not the bundled default", () => {
    expect(() =>
      requireFreshV2DatabaseState({
        effectiveGenerationInstructions: "stale instructions",
        rowCounts: {
          answer_options: 0,
          card_drafts: 0,
          flashcard_decks: 0,
          flashcards: 0,
          generation_instructions: 0,
          question_image_cleanup: 0,
          question_image_uploads: 0,
          quizzes: 0,
          quiz_questions: 0,
          quiz_results: 0,
          source_texts: 0,
          study_results: 0,
        },
      }),
    ).toThrow(
      "Release database does not expose the bundled Default Generation Template.",
    );
  });

  it("requires the complete Quiz Result history schema", () => {
    expect(expectedDatabaseObjects).toEqual(
      expect.arrayContaining([
        "base table: quiz_results",
        "column: quiz_results.question_id",
        "column: quiz_results.translation_help_used",
        "constraint: quiz_results_outcome_valid",
        "constraint: quiz_results_question_id_quiz_questions_id_fk",
      ]),
    );
  });

  it("accepts a database containing every checked-in migration", () => {
    expect(() =>
      requireCompleteMigrationHistory(expectedMigrations, ["100", "200", "300"]),
    ).not.toThrow();
  });

  it("rejects a migrated database missing a required schema object", () => {
    expect(() =>
      requireExpectedDatabaseObjects(
        [
          "base table: flashcards",
          "column: flashcards.recall_streak",
          "constraint: flashcards_recall_streak_valid",
        ],
        ["base table: flashcards", "column: flashcards.recall_streak"],
      ),
    ).toThrow(
      "Database schema is incomplete. Missing objects: constraint: flashcards_recall_streak_valid.",
    );
  });

  it("rejects a database missing a checked-in migration", () => {
    expect(() =>
      requireCompleteMigrationHistory(expectedMigrations, ["100", "200"]),
    ).toThrow(
      "Database migration history is incomplete. Missing migrations: 0002_study_history.",
    );
  });

  it("allows database migrations newer than the checked-in application", () => {
    expect(() =>
      requireCompleteMigrationHistory(expectedMigrations, [
        "100",
        "200",
        "300",
        "400",
      ]),
    ).not.toThrow();
  });
});
