import "server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getPostgresQuestionImageUploadRepository } from "../adapters/persistence/postgres/database";
import { requireRailwayBucketConfiguration } from "../adapters/storage/railway-bucket-configuration";
import { createS3QuestionImageStorage } from "../adapters/storage/s3-question-image-storage";
import { createQuestionImageService } from "../application/question-images";

export function getQuestionImageService() {
  const configuration = requireRailwayBucketConfiguration(process.env);
  const client = new S3Client({
    endpoint: configuration.endpoint,
    region: configuration.region,
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: configuration.accessKeyId,
      secretAccessKey: configuration.secretAccessKey,
    },
  });
  return createQuestionImageService(
    createS3QuestionImageStorage(
      client,
      configuration.bucket,
      (signingClient, command, options) =>
        getSignedUrl(signingClient as S3Client, command, options),
    ),
    getPostgresQuestionImageUploadRepository(),
  );
}
