import { describe, expect, it, vi } from "vitest";
import {
  QuestionImageValidationError,
  createQuestionImageService,
  type QuestionImageStorage,
  type QuestionImageUpload,
  type QuestionImageUploadRepository,
} from "./question-images";

class MemoryUploads implements QuestionImageUploadRepository {
  uploads: QuestionImageUpload[] = [];
  cleanup = new Set<string>();

  async create(upload: QuestionImageUpload) {
    this.uploads.push(structuredClone(upload));
  }

  async get(id: string) {
    return structuredClone(this.uploads.find((upload) => upload.id === id));
  }

  async markCompleted(id: string) {
    const upload = this.uploads.find((candidate) => candidate.id === id);
    if (!upload || upload.status !== "pending") return undefined;
    upload.status = "completed";
    return structuredClone(upload);
  }

  async listCleanup() {
    return [...this.cleanup];
  }

  async completeCleanup(objectKey: string) {
    this.cleanup.delete(objectKey);
  }

  async recordCleanupFailure() {}
}

function fakeStorage(overrides: Partial<QuestionImageStorage> = {}) {
  return {
    presignUpload: vi.fn(async () => "https://bucket.example/upload"),
    presignRead: vi.fn(async () => "https://bucket.example/read"),
    head: vi.fn(async () => ({ contentType: "image/png", byteSize: 2048 })),
    delete: vi.fn(async () => undefined),
    ...overrides,
  } satisfies QuestionImageStorage;
}

describe("Question Image uploads", () => {
  it("authorizes one supported image with a short-lived, metadata-bound upload URL", async () => {
    const uploads = new MemoryUploads();
    const storage = fakeStorage();
    const images = createQuestionImageService(storage, uploads);

    const authorization = await images.authorize({
      originalName: "Et bilde.png",
      contentType: "image/png",
      byteSize: 2048,
    });

    expect(authorization).toMatchObject({
      uploadId: expect.any(String),
      uploadUrl: "https://bucket.example/upload",
      expiresInSeconds: 300,
    });
    expect(storage.presignUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^question-images\/[0-9a-f-]+\/Et-bilde\.png$/),
      { contentType: "image/png", byteSize: 2048, expiresInSeconds: 300 },
    );
    expect(uploads.uploads).toHaveLength(1);
  });

  it.each([
    ["application/pdf", 2048, "Choose a JPEG, PNG, WebP, or GIF image."],
    ["image/png", 25 * 1024 * 1024 + 1, "Question Images must be 25 MB or smaller."],
  ])("rejects unsupported or oversized upload authorization", async (contentType, byteSize, message) => {
    const images = createQuestionImageService(fakeStorage(), new MemoryUploads());

    await expect(images.authorize({ originalName: "file", contentType, byteSize }))
      .rejects.toEqual(new QuestionImageValidationError(message));
  });

  it("completes an upload only after bucket metadata matches the authorization", async () => {
    const uploads = new MemoryUploads();
    const images = createQuestionImageService(fakeStorage(), uploads);
    const { uploadId } = await images.authorize({
      originalName: "photo.png",
      contentType: "image/png",
      byteSize: 2048,
    });

    await expect(images.complete(uploadId)).resolves.toMatchObject({
      id: uploadId,
      status: "completed",
    });
  });

  it("rejects completion when the uploaded object metadata differs", async () => {
    const uploads = new MemoryUploads();
    const storage = fakeStorage({
      head: vi.fn(async () => ({ contentType: "image/png", byteSize: 1024 })),
    });
    const images = createQuestionImageService(storage, uploads);
    const { uploadId } = await images.authorize({
      originalName: "photo.png",
      contentType: "image/png",
      byteSize: 2048,
    });

    await expect(images.complete(uploadId)).rejects.toThrow(
      "Uploaded image does not match its authorization.",
    );
    expect(uploads.uploads[0].status).toBe("pending");
  });
});

describe("Question Image cleanup", () => {
  it("leaves failed cleanup queued so a later attempt can retry it", async () => {
    const uploads = new MemoryUploads();
    uploads.cleanup.add("question-images/old/photo.png");
    const storage = fakeStorage({
      delete: vi.fn(async () => {
        throw new Error("bucket unavailable");
      }),
    });
    const images = createQuestionImageService(storage, uploads);

    await expect(images.cleanup()).resolves.toEqual({ cleaned: 0, failed: 1 });
    expect(await uploads.listCleanup()).toEqual(["question-images/old/photo.png"]);
  });
});
