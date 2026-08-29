type CorsRule = {
  AllowedOrigins?: string[];
  AllowedMethods?: string[];
  AllowedHeaders?: string[];
};

function allowsUpload(rule: CorsRule, origin: string) {
  const origins = rule.AllowedOrigins ?? [];
  const methods = rule.AllowedMethods ?? [];
  const headers = (rule.AllowedHeaders ?? []).map((header) => header.toLowerCase());
  return (origins.includes(origin) || origins.includes("*")) &&
    methods.includes("PUT") &&
    (headers.includes("*") || headers.includes("content-type"));
}

export function requireQuestionImageBucketCors(
  rules: CorsRule[],
  expectedOrigins: string[],
) {
  const missing = expectedOrigins.filter(
    (origin) => !rules.some((rule) => allowsUpload(rule, origin)),
  );
  if (missing.length > 0) {
    throw new Error(
      `Railway Bucket CORS is missing Question Image PUT access for: ${missing.join(", ")}.`,
    );
  }
}
