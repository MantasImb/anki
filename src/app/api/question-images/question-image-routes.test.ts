import { beforeEach, describe, expect, it, vi } from "vitest";

const authorize = vi.fn();
const complete = vi.fn();

vi.mock("@/composition/question-images", () => ({
  getQuestionImageService: () => ({ authorize, complete }),
}));

import { POST as authorizePost } from "./authorize/route";
import { POST as completePost } from "./complete/route";

beforeEach(() => {
  authorize.mockReset();
  complete.mockReset();
});

describe("Question Image route handlers", () => {
  it("returns a narrowly scoped upload authorization", async () => {
    authorize.mockResolvedValue({
      uploadId: "upload-a",
      uploadUrl: "https://bucket.example/upload",
      expiresInSeconds: 300,
    });
    const response = await authorizePost(new Request("http://localhost/api/question-images/authorize", {
      method: "POST",
      body: JSON.stringify({
        originalName: "photo.png",
        contentType: "image/png",
        byteSize: 2048,
      }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      uploadId: "upload-a",
      uploadUrl: "https://bucket.example/upload",
      expiresInSeconds: 300,
    });
  });

  it("confirms completion without returning object credentials or keys", async () => {
    complete.mockResolvedValue({ id: "upload-a", objectKey: "private-key" });
    const response = await completePost(new Request("http://localhost/api/question-images/complete", {
      method: "POST",
      body: JSON.stringify({ uploadId: "upload-a" }),
    }));

    expect(await response.json()).toEqual({ uploadId: "upload-a" });
  });
});
