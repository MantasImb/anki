import { describe, expect, it } from "vitest";
import { requireReleaseConfiguration } from "./release";

const providerConfiguration = {
  OPENAI_API_KEY: "sk-test-secret",
  OPENAI_MODEL: "gpt-test",
};

describe("release configuration", () => {
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
