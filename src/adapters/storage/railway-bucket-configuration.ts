type Environment = Readonly<Record<string, string | undefined>>;

const REQUIRED = [
  "RAILWAY_BUCKET_ENDPOINT",
  "RAILWAY_BUCKET_REGION",
  "RAILWAY_BUCKET_NAME",
  "RAILWAY_BUCKET_ACCESS_KEY_ID",
  "RAILWAY_BUCKET_SECRET_ACCESS_KEY",
  "QUESTION_IMAGE_ALLOWED_ORIGINS",
] as const;

export function requireRailwayBucketConfiguration(environment: Environment) {
  for (const name of REQUIRED) {
    if (!environment[name]?.trim()) throw new Error(`${name} is required.`);
  }
  if (environment.NEXT_PUBLIC_RAILWAY_BUCKET_ACCESS_KEY_ID?.trim()) {
    throw new Error(
      "NEXT_PUBLIC_RAILWAY_BUCKET_ACCESS_KEY_ID must not be set because bucket credentials are server-only.",
    );
  }
  if (environment.NEXT_PUBLIC_RAILWAY_BUCKET_SECRET_ACCESS_KEY?.trim()) {
    throw new Error(
      "NEXT_PUBLIC_RAILWAY_BUCKET_SECRET_ACCESS_KEY must not be set because bucket credentials are server-only.",
    );
  }

  let endpoint: URL;
  try {
    endpoint = new URL(environment.RAILWAY_BUCKET_ENDPOINT!);
  } catch {
    throw new Error("RAILWAY_BUCKET_ENDPOINT must be a valid HTTPS URL.");
  }
  if (endpoint.protocol !== "https:") {
    throw new Error("RAILWAY_BUCKET_ENDPOINT must be a valid HTTPS URL.");
  }
  const allowedOrigins = environment.QUESTION_IMAGE_ALLOWED_ORIGINS!
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (allowedOrigins.length === 0 || allowedOrigins.some((origin) => {
    try {
      const url = new URL(origin);
      return !["http:", "https:"].includes(url.protocol) || url.origin !== origin;
    } catch {
      return true;
    }
  })) {
    throw new Error(
      "QUESTION_IMAGE_ALLOWED_ORIGINS must contain comma-separated HTTP origins.",
    );
  }

  return {
    endpoint: endpoint.toString().replace(/\/$/u, ""),
    region: environment.RAILWAY_BUCKET_REGION!.trim(),
    bucket: environment.RAILWAY_BUCKET_NAME!.trim(),
    accessKeyId: environment.RAILWAY_BUCKET_ACCESS_KEY_ID!.trim(),
    secretAccessKey: environment.RAILWAY_BUCKET_SECRET_ACCESS_KEY!.trim(),
    allowedOrigins: [...new Set(allowedOrigins)],
  };
}
