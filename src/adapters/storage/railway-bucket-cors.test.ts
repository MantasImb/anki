import { describe, expect, it } from "vitest";
import { requireQuestionImageBucketCors } from "./railway-bucket-cors";

describe("Railway Bucket CORS", () => {
  it("accepts PUT access for every configured browser origin", () => {
    expect(() => requireQuestionImageBucketCors([
      {
        AllowedOrigins: ["http://localhost:3000", "https://anki.example"],
        AllowedMethods: ["PUT"],
        AllowedHeaders: ["*"],
      },
    ], ["http://localhost:3000", "https://anki.example"])).not.toThrow();
  });

  it("reports missing upload origins without exposing credentials", () => {
    expect(() => requireQuestionImageBucketCors([
      {
        AllowedOrigins: ["http://localhost:3000"],
        AllowedMethods: ["PUT"],
        AllowedHeaders: ["Content-Type"],
      },
    ], ["http://localhost:3000", "https://anki.example"])).toThrow(
      "Railway Bucket CORS is missing Question Image PUT access for: https://anki.example.",
    );
  });

  it("accepts full wildcard access for every configured origin", () => {
    expect(() => requireQuestionImageBucketCors([
      {
        AllowedOrigins: ["*"],
        AllowedMethods: ["PUT"],
        AllowedHeaders: ["*"],
      },
    ], ["http://localhost:3000", "https://*.vercel.app"])).not.toThrow();
  });

  it("does not treat a stored partial wildcard as verified Railway access", () => {
    expect(() => requireQuestionImageBucketCors([
      {
        AllowedOrigins: ["https://*.vercel.app"],
        AllowedMethods: ["PUT"],
        AllowedHeaders: ["*"],
      },
    ], ["https://*.vercel.app"])).toThrow(
      "Railway Bucket CORS is missing Question Image PUT access for: https://*.vercel.app.",
    );
  });
});
