import { describe, expect, it } from "vitest";
import { validateDeploymentConfiguration } from "./deployment";

const validEnvironment = {
  DATABASE_URL: "postgresql://learner:secret@railway.example:5432/railway",
  OPENAI_API_KEY: "sk-test-secret",
  OPENAI_MODEL: "gpt-test",
};

describe("deployment configuration", () => {
  it("accepts complete server-only production configuration", () => {
    expect(validateDeploymentConfiguration(validEnvironment)).toEqual({
      databaseUrl:
        "postgresql://learner:secret@railway.example:5432/railway",
      openAI: {
        apiKey: "sk-test-secret",
        maximumSourceTextCharacters: 20_000,
        model: "gpt-test",
        timeoutMilliseconds: 60_000,
      },
    });
  });

  it.each([
    [
      { ...validEnvironment, DATABASE_URL: "https://railway.example/db" },
      "DATABASE_URL must be a PostgreSQL connection URL.",
    ],
    [
      { ...validEnvironment, NEXT_PUBLIC_DATABASE_URL: "exposed" },
      "NEXT_PUBLIC_DATABASE_URL must not be set because database credentials are server-only.",
    ],
    [
      { ...validEnvironment, NEXT_PUBLIC_OPENAI_API_KEY: "exposed" },
      "NEXT_PUBLIC_OPENAI_API_KEY must not be set because provider credentials are server-only.",
    ],
  ])("rejects unsafe deployment configuration", (environment, message) => {
    expect(() => validateDeploymentConfiguration(environment)).toThrow(message);
  });

  it("does not include configured secrets in validation errors", () => {
    const secret = "this-value-must-never-appear";

    try {
      validateDeploymentConfiguration({
        ...validEnvironment,
        DATABASE_URL: secret,
      });
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });
});
