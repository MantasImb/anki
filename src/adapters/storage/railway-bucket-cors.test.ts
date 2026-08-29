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
});
