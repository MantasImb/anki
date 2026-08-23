import { describe, expect, it } from "vitest";
import {
  requireCompleteMigrationHistory,
  requireExpectedDatabaseObjects,
} from "./migration-readiness";

const expectedMigrations = [
  { tag: "0000_initial", when: 100 },
  { tag: "0001_constraints", when: 200 },
  { tag: "0002_study_history", when: 300 },
];

describe("release migration readiness", () => {
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
