import { describe, expect, it } from "vitest";
import { requireGoogleTranslationConfiguration } from "./google-translation-configuration";

const credentials = JSON.stringify({
  client_email: "translator@example.iam.gserviceaccount.com",
  private_key: "private-secret",
});

describe("Google Translation configuration", () => {
  it("provides server-only Advanced API configuration", () => {
    expect(
      requireGoogleTranslationConfiguration({
        GOOGLE_CLOUD_PROJECT_ID: "learning-project",
        GOOGLE_CLOUD_TRANSLATION_CREDENTIALS: credentials,
      }),
    ).toEqual({
      credentials: {
        client_email: "translator@example.iam.gserviceaccount.com",
        private_key: "private-secret",
      },
      location: "global",
      projectId: "learning-project",
      timeoutMilliseconds: 10_000,
    });
  });

  it.each([
    [{ GOOGLE_CLOUD_TRANSLATION_CREDENTIALS: credentials }, "GOOGLE_CLOUD_PROJECT_ID is required."],
    [{ GOOGLE_CLOUD_PROJECT_ID: "learning-project" }, "GOOGLE_CLOUD_TRANSLATION_CREDENTIALS is required."],
    [
      {
        GOOGLE_CLOUD_PROJECT_ID: "learning-project",
        GOOGLE_CLOUD_TRANSLATION_CREDENTIALS: "private-invalid-json",
      },
      "GOOGLE_CLOUD_TRANSLATION_CREDENTIALS must be valid service account JSON.",
    ],
  ])("fails clearly without exposing configured values", (environment, message) => {
    try {
      requireGoogleTranslationConfiguration(environment);
      throw new Error("Expected configuration validation to fail.");
    } catch (error) {
      expect(String(error)).toContain(message);
      expect(String(error)).not.toContain("private-invalid-json");
      expect(String(error)).not.toContain("private-secret");
    }
  });
});
