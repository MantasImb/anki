import { describe, expect, it } from "vitest";
import {
  requireReleaseConfiguration,
  requireReleaseCutoverConfiguration,
} from "./release";

const providerConfiguration = {
  GOOGLE_CLOUD_PROJECT_ID: "learning-project",
  GOOGLE_CLOUD_TRANSLATION_CREDENTIALS: JSON.stringify({
    client_email: "translator@example.iam.gserviceaccount.com",
    private_key: "google-secret",
  }),
  OPENAI_API_KEY: "sk-test-secret",
  OPENAI_MODEL: "gpt-test",
  RAILWAY_BUCKET_ENDPOINT: "https://storage.railway.app",
  RAILWAY_BUCKET_REGION: "auto",
  RAILWAY_BUCKET_NAME: "question-images",
  RAILWAY_BUCKET_ACCESS_KEY_ID: "bucket-access",
  RAILWAY_BUCKET_SECRET_ACCESS_KEY: "bucket-secret",
  QUESTION_IMAGE_ALLOWED_ORIGINS: "http://localhost:3000",
};

describe("release configuration", () => {
  it("authorizes cutover only when the safe database identity is confirmed exactly", () => {
    const configuration = requireReleaseCutoverConfiguration({
      ...providerConfiguration,
      RELEASE_DATABASE_URL:
        "postgresql://release:secret@production.example:6432/production",
      RELEASE_DATABASE_CONFIRMATION: "production.example:6432/production",
      RELEASE_TRAFFIC_ISOLATED: "true",
    });

    expect(configuration.databaseIdentity).toBe(
      "production.example:6432/production",
    );
  });

  it.each([undefined, "preview.example:5432/preview"])(
    "rejects missing or wrong cutover confirmation without exposing credentials",
    (confirmation) => {
      const secret = "cutover-secret-value";

      expect(() =>
        requireReleaseCutoverConfiguration({
          ...providerConfiguration,
          RELEASE_DATABASE_URL: `postgresql://release:${secret}@production.example:6432/production`,
          RELEASE_DATABASE_CONFIRMATION: confirmation,
        }),
      ).toThrow(
        "RELEASE_DATABASE_CONFIRMATION must exactly match production.example:6432/production.",
      );

      try {
        requireReleaseCutoverConfiguration({
          ...providerConfiguration,
          RELEASE_DATABASE_URL: `postgresql://release:${secret}@production.example:6432/production`,
          RELEASE_DATABASE_CONFIRMATION: confirmation,
        });
      } catch (error) {
        expect(String(error)).not.toContain(secret);
      }
    },
  );

  it("rejects cutover until the target is isolated from application traffic", () => {
    expect(() =>
      requireReleaseCutoverConfiguration({
        ...providerConfiguration,
        RELEASE_DATABASE_URL:
          "postgresql://release:secret@production.example:6432/production",
        RELEASE_DATABASE_CONFIRMATION: "production.example:6432/production",
      }),
    ).toThrow(
      "RELEASE_TRAFFIC_ISOLATED must be true before resetting the release database.",
    );
  });

  it("uses the explicit release database instead of the local application database", () => {
    const configuration = requireReleaseConfiguration({
      ...providerConfiguration,
      DATABASE_URL: "postgresql://local:secret@preview.example:5432/preview",
      RELEASE_DATABASE_URL:
        "postgresql://release:secret@production.example:6432/production",
    });

    expect(configuration.databaseUrl).toBe(
      "postgresql://release:secret@production.example:6432/production",
    );
    expect(configuration.databaseIdentity).toBe(
      "production.example:6432/production",
    );
  });

  it("rejects release preparation without an explicit release database", () => {
    expect(() =>
      requireReleaseConfiguration({
        ...providerConfiguration,
        DATABASE_URL: "postgresql://local:secret@preview.example:5432/preview",
      }),
    ).toThrow("RELEASE_DATABASE_URL is required for release preparation.");
  });

  it("does not include release database credentials in its safe identity", () => {
    const configuration = requireReleaseConfiguration({
      ...providerConfiguration,
      RELEASE_DATABASE_URL:
        "postgresql://release-user:release-secret@railway.example:5432/railway",
    });

    expect(configuration.databaseIdentity).toBe("railway.example:5432/railway");
    expect(configuration.databaseIdentity).not.toContain("release-user");
    expect(configuration.databaseIdentity).not.toContain("release-secret");
  });
});
