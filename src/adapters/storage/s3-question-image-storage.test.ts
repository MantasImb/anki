import { describe, expect, it, vi } from "vitest";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { createS3QuestionImageStorage } from "./s3-question-image-storage";

describe("S3-compatible Question Image storage", () => {
  it("presigns uploads and reads for the configured private bucket", async () => {
    const client = { send: vi.fn() };
    const sign = vi.fn(async () => "https://signed.example/object");
    const storage = createS3QuestionImageStorage(
      client,
      "private-images",
      sign,
    );

    await expect(storage.presignUpload("question-images/a/photo.png", {
      contentType: "image/png",
      byteSize: 2048,
      expiresInSeconds: 300,
    })).resolves.toBe("https://signed.example/object");
    await storage.presignRead("question-images/a/photo.png", 300);

    expect(sign.mock.calls[0][1]).toBeInstanceOf(PutObjectCommand);
    expect(sign.mock.calls[0][1].input).toMatchObject({
      Bucket: "private-images",
      Key: "question-images/a/photo.png",
      ContentType: "image/png",
      ContentLength: 2048,
    });
    expect(sign.mock.calls[0][2]).toEqual({ expiresIn: 300 });
    expect(sign.mock.calls[1][1]).toBeInstanceOf(GetObjectCommand);
  });

  it("reads stored metadata and deletes only the requested object key", async () => {
    const client = {
      send: vi.fn(async (command: unknown) =>
        command instanceof HeadObjectCommand
          ? { ContentType: "image/gif", ContentLength: 4096 }
          : {},
      ),
    };
    const storage = createS3QuestionImageStorage(
      client,
      "private-images",
      vi.fn(),
    );

    await expect(storage.head("question-images/a/animated.gif")).resolves.toEqual({
      contentType: "image/gif",
      byteSize: 4096,
    });
    await storage.delete("question-images/a/animated.gif");

    expect(client.send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
    expect(client.send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectCommand);
    expect(client.send.mock.calls[1][0].input).toMatchObject({
      Bucket: "private-images",
      Key: "question-images/a/animated.gif",
    });
  });
});
