import { describe, expect, it } from "vitest";
import { requireRailwayBucketConfiguration } from "./railway-bucket-configuration";

const validEnvironment = {
  RAILWAY_BUCKET_ENDPOINT: "https://storage.railway.app",
  RAILWAY_BUCKET_REGION: "auto",
  RAILWAY_BUCKET_NAME: "question-images",
  RAILWAY_BUCKET_ACCESS_KEY_ID: "access-id",
  RAILWAY_BUCKET_SECRET_ACCESS_KEY: "secret-key",
  QUESTION_IMAGE_ALLOWED_ORIGINS: "http://localhost:3000, https://anki.example",
};

describe("Railway Bucket configuration", () => {
  it("accepts complete server-only S3-compatible configuration", () => {
    expect(requireRailwayBucketConfiguration(validEnvironment)).toEqual({
      endpoint: "https://storage.railway.app",
      region: "auto",
      bucket: "question-images",
      accessKeyId: "access-id",
      secretAccessKey: "secret-key",
      allowedOrigins: ["http://localhost:3000", "https://anki.example"],
    });
  });

  it("rejects browser-exposed bucket credentials without printing them", () => {
    const secret = "must-not-appear";
    expect(() => requireRailwayBucketConfiguration({
      ...validEnvironment,
      NEXT_PUBLIC_RAILWAY_BUCKET_SECRET_ACCESS_KEY: secret,
    })).toThrow(
      "NEXT_PUBLIC_RAILWAY_BUCKET_SECRET_ACCESS_KEY must not be set because bucket credentials are server-only.",
    );
    try {
      requireRailwayBucketConfiguration({
        ...validEnvironment,
        RAILWAY_BUCKET_ENDPOINT: secret,
      });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });
});
