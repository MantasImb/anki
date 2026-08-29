import { GetBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";
import { requireRailwayBucketConfiguration } from "../src/adapters/storage/railway-bucket-configuration";
import { requireQuestionImageBucketCors } from "../src/adapters/storage/railway-bucket-cors";

const configuration = requireRailwayBucketConfiguration(process.env);
const client = new S3Client({
  endpoint: configuration.endpoint,
  region: configuration.region,
  credentials: {
    accessKeyId: configuration.accessKeyId,
    secretAccessKey: configuration.secretAccessKey,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
});

const output = await client.send(new GetBucketCorsCommand({
  Bucket: configuration.bucket,
}));
requireQuestionImageBucketCors(
  output.CORSRules ?? [],
  configuration.allowedOrigins,
);
console.log(
  `Railway Bucket CORS allows Question Image uploads from ${configuration.allowedOrigins.length} configured origin(s).`,
);
