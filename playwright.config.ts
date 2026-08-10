import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.RELEASE_BASE_URL;

if (!baseURL) {
  throw new Error(
    "RELEASE_BASE_URL is required and must point to the dedicated Vercel Preview deployment.",
  );
}

export default defineConfig({
  expect: { timeout: 10_000 },
  forbidOnly: true,
  reporter: "list",
  testDir: "./tests/e2e",
  timeout: 180_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "phone-chromium",
      use: { ...devices["iPhone 13"] },
    },
  ],
});
