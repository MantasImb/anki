import { describe, expect, it, vi } from "vitest";
import {
  DatabaseOperationError,
  withDatabaseDiagnostics,
} from "./database-diagnostics";

describe("PostgreSQL diagnostics", () => {
  it("reports actionable metadata without exposing sensitive query details", async () => {
    const sourceText = "private curriculum source text";
    const databaseUrl = "postgresql://learner:secret@railway.example/db";
    const cause = Object.assign(new Error(`query failed for ${sourceText}`), {
      code: "23505",
      constraint: "flashcards_front_unique",
    });
    const repository = {
      async create() {
        throw Object.assign(new Error(`Failed query with ${databaseUrl}`), {
          cause,
        });
      },
    };
    const databaseFailed = vi.fn();
    const diagnosed = withDatabaseDiagnostics(repository, "flashcards", {
      databaseFailed,
    });

    await expect(diagnosed.create()).rejects.toEqual(
      new DatabaseOperationError(),
    );
    expect(databaseFailed).toHaveBeenCalledWith({
      code: "23505",
      constraint: "flashcards_front_unique",
      errorType: "Error",
      operation: "create",
      repository: "flashcards",
    });
    expect(JSON.stringify(databaseFailed.mock.calls)).not.toContain(sourceText);
    expect(JSON.stringify(databaseFailed.mock.calls)).not.toContain(databaseUrl);
  });

  it("preserves non-database domain failures", async () => {
    const unavailable = new Error("Flashcard is unavailable.");
    const repository = {
      async get() {
        throw unavailable;
      },
    };
    const databaseFailed = vi.fn();
    const diagnosed = withDatabaseDiagnostics(repository, "flashcards", {
      databaseFailed,
    });

    await expect(diagnosed.get()).rejects.toBe(unavailable);
    expect(databaseFailed).not.toHaveBeenCalled();
  });
});
