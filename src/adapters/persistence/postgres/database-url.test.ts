import { describe, expect, it } from "vitest";
import { requireDatabaseUrl } from "./database-url";

describe("PostgreSQL configuration", () => {
  it("fails clearly when DATABASE_URL is missing", () => {
    expect(() => requireDatabaseUrl({})).toThrow(
      "DATABASE_URL is required to persist Flashcards.",
    );
  });
});
