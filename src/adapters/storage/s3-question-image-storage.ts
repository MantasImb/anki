import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import type { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { QuestionImageStorage } from "../../application/question-images";

type StorageClient = {
  send(command: HeadObjectCommand | DeleteObjectCommand): Promise<unknown>;
};

type Signer = (
  client: unknown,
  command: PutObjectCommand | GetObjectCommand,
  options: { expiresIn: number },
) => Promise<string>;

export function createS3QuestionImageStorage(
  client: StorageClient,
  bucket: string,
  sign: Signer,
): QuestionImageStorage {
  return {
    presignUpload(objectKey, constraints) {
      return sign(
        client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          ContentType: constraints.contentType,
          ContentLength: constraints.byteSize,
        }),
        { expiresIn: constraints.expiresInSeconds },
      );
    },
    presignRead(objectKey, expiresInSeconds) {
      return sign(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
        { expiresIn: expiresInSeconds },
      );
    },
    async head(objectKey) {
      const output = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: objectKey }),
      ) as { ContentType?: string; ContentLength?: number };
      return {
        contentType: output.ContentType,
        byteSize: output.ContentLength,
      };
    },
    async delete(objectKey) {
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }),
      );
    },
  };
}

export type AwsQuestionImageClient = S3Client;
export type AwsQuestionImageSigner = typeof getSignedUrl;
