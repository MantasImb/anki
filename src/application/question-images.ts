export const QUESTION_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const QUESTION_IMAGE_WARNING_BYTES = 5 * 1024 * 1024;
export const QUESTION_IMAGE_MAXIMUM_BYTES = 25 * 1024 * 1024;
const UPLOAD_URL_LIFETIME_SECONDS = 300;
const READ_URL_LIFETIME_SECONDS = 900;

export type QuestionImageContentType =
  (typeof QUESTION_IMAGE_CONTENT_TYPES)[number];

export type QuestionImage = {
  objectKey: string;
  originalName: string;
  contentType: QuestionImageContentType;
  byteSize: number;
};

export type QuestionImageUpload = QuestionImage & {
  id: string;
  status: "pending" | "completed" | "attached";
};

export interface QuestionImageStorage {
  presignUpload(
    objectKey: string,
    constraints: {
      contentType: QuestionImageContentType;
      byteSize: number;
      expiresInSeconds: number;
    },
  ): Promise<string>;
  presignRead(
    objectKey: string,
    expiresInSeconds: number,
  ): Promise<string>;
  head(objectKey: string): Promise<{
    contentType: string | undefined;
    byteSize: number | undefined;
  }>;
  delete(objectKey: string): Promise<void>;
}

export interface QuestionImageUploadRepository {
  create(upload: QuestionImageUpload): Promise<void>;
  get(id: string): Promise<QuestionImageUpload | undefined>;
  markCompleted(id: string): Promise<QuestionImageUpload | undefined>;
  listCleanup(limit?: number): Promise<string[]>;
  completeCleanup(objectKey: string): Promise<void>;
  recordCleanupFailure(objectKey: string, message: string): Promise<void>;
}

export class QuestionImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestionImageValidationError";
  }
}

function contentType(value: string): QuestionImageContentType {
  if (!QUESTION_IMAGE_CONTENT_TYPES.includes(value as QuestionImageContentType)) {
    throw new QuestionImageValidationError(
      "Choose a JPEG, PNG, WebP, or GIF image.",
    );
  }
  return value as QuestionImageContentType;
}

function validateByteSize(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new QuestionImageValidationError("Question Image size is invalid.");
  }
  if (value > QUESTION_IMAGE_MAXIMUM_BYTES) {
    throw new QuestionImageValidationError(
      "Question Images must be 25 MB or smaller.",
    );
  }
}

function safeFileName(originalName: string) {
  const normalized = originalName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 120);
  return normalized || "image";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown cleanup failure";
}

export function createQuestionImageService(
  storage: QuestionImageStorage,
  uploads: QuestionImageUploadRepository,
) {
  return {
    async authorize(input: {
      originalName: string;
      contentType: string;
      byteSize: number;
    }) {
      const acceptedContentType = contentType(input.contentType);
      validateByteSize(input.byteSize);
      const id = crypto.randomUUID();
      const upload: QuestionImageUpload = {
        id,
        objectKey: `question-images/${id}/${safeFileName(input.originalName)}`,
        originalName: input.originalName.slice(0, 255) || "image",
        contentType: acceptedContentType,
        byteSize: input.byteSize,
        status: "pending",
      };
      await uploads.create(upload);
      const uploadUrl = await storage.presignUpload(upload.objectKey, {
        contentType: upload.contentType,
        byteSize: upload.byteSize,
        expiresInSeconds: UPLOAD_URL_LIFETIME_SECONDS,
      });
      return {
        uploadId: upload.id,
        uploadUrl,
        expiresInSeconds: UPLOAD_URL_LIFETIME_SECONDS,
      };
    },

    async complete(uploadId: string) {
      const upload = await uploads.get(uploadId);
      if (!upload || upload.status !== "pending") {
        throw new QuestionImageValidationError(
          "Question Image upload was not found or is already complete.",
        );
      }
      const stored = await storage.head(upload.objectKey);
      if (
        stored.contentType !== upload.contentType ||
        stored.byteSize !== upload.byteSize
      ) {
        throw new QuestionImageValidationError(
          "Uploaded image does not match its authorization.",
        );
      }
      const completed = await uploads.markCompleted(uploadId);
      if (!completed) {
        throw new QuestionImageValidationError(
          "Question Image upload could not be completed.",
        );
      }
      return completed;
    },

    readUrl(image: Pick<QuestionImage, "objectKey">) {
      return storage.presignRead(image.objectKey, READ_URL_LIFETIME_SECONDS);
    },

    async cleanup() {
      let cleaned = 0;
      let failed = 0;
      for (const objectKey of await uploads.listCleanup(20)) {
        try {
          await storage.delete(objectKey);
          await uploads.completeCleanup(objectKey);
          cleaned += 1;
        } catch (error) {
          await uploads.recordCleanupFailure(objectKey, errorMessage(error));
          failed += 1;
        }
      }
      return { cleaned, failed };
    },
  };
}
