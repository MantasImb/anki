import { randomUUID } from "node:crypto";
import { expect, test as base, type Dialog, type Page } from "@playwright/test";

async function deleteCollectionsByMarker(
  page: Page,
  marker: string,
  collection: "Flashcard Deck" | "Quiz",
) {
  const listPath = collection === "Quiz" ? "/quizzes" : "/decks";
  await page.goto(listPath);
  const matchingCollections = page.getByRole("link").filter({ hasText: marker });
  const acceptDeletion = (dialog: Dialog) => dialog.accept();
  page.on("dialog", acceptDeletion);

  try {
    while ((await matchingCollections.count()) > 0) {
      await matchingCollections.first().click();
      await page.getByRole("button", { name: `Delete ${collection}` }).click();
      await expect(page).toHaveURL(new RegExp(`${listPath}$`));
    }
  } finally {
    page.off("dialog", acceptDeletion);
  }

  await expect(matchingCollections).toHaveCount(0);
}

const test = base.extend<{ runMarker: string }>({
  runMarker: async ({ page }, provide) => {
    const marker = `e2e-${randomUUID()}`;
    await provide(marker);
    await deleteCollectionsByMarker(page, marker, "Flashcard Deck");
    await deleteCollectionsByMarker(page, marker, "Quiz");
  },
});

async function createCollection(
  page: Page,
  marker: string,
  collection: "Flashcard Deck" | "Quiz",
) {
  const listPath = collection === "Quiz" ? "/quizzes" : "/decks";
  const name = `${collection} ${marker}`;
  await page.goto(listPath);
  await page.getByLabel(`${collection} name`).fill(name);
  await page.getByRole("button", { name: `Create ${collection}` }).click();
  await expect(page).toHaveURL(new RegExp(`${listPath}/[^/]+$`));
  await expect(page.getByRole("heading", { name })).toBeVisible();
  return new URL(page.url()).pathname;
}

async function answerDeck(page: Page, assessment: "Correct" | "Incorrect") {
  await page.getByRole("button", { name: "Reveal English Back" }).click();
  await page.getByRole("button", { name: assessment, exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reveal English Back" }),
  ).toBeVisible();
}

test("phone Deck journey persists learned progress", async ({ page, runMarker }) => {
  const deckPath = await createCollection(page, runMarker, "Flashcard Deck");
  const front = `rolig ${runMarker}`;
  const back = `calm ${runMarker}`;

  await page.getByRole("link", { name: "Add Flashcard" }).click();
  await page.getByLabel("Norwegian Front").fill(front);
  await page.getByLabel("English Back").fill(back);
  await page.getByRole("button", { name: "Save Flashcard" }).click();
  await expect(page).toHaveURL(new RegExp(`${deckPath}$`));
  await expect(page.getByText(front, { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Study Deck" }).click();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await expect(page.getByText(front, { exact: true })).toBeVisible();
    await answerDeck(page, "Correct");
  }

  await page.goto(deckPath);
  await expect(page.getByText("Deck Progress: 100% Learned")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Deck Progress: 100% Learned")).toBeVisible();
  await expect(page.getByText("Recall streak 3/3")).toBeVisible();
});

const questionImage = {
  name: "release-question.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
};

function norwegianPrompt(index: number, marker: string) {
  return `Spørsmål ${index} ${marker}`;
}

function correctOption(index: number, marker: string, suffix = "A") {
  return `Riktig ${index}${suffix} ${marker}`;
}

async function addQuestion(
  page: Page,
  quizPath: string,
  marker: string,
  index: number,
  { image = false, translate = false, multiple = false } = {},
) {
  await page.goto(`${quizPath}/questions/new`);
  await page.getByLabel("Norwegian prompt").fill(norwegianPrompt(index, marker));
  await page.getByLabel("Norwegian option 1").fill(correctOption(index, marker));
  await page.getByLabel("Norwegian option 2").fill(`Feil ${index} ${marker}`);

  if (multiple) {
    await page.getByRole("button", { name: "Add option" }).click();
    await page
      .getByLabel("Norwegian option 3")
      .fill(correctOption(index, marker, "B"));
    await page.getByLabel("Correct option 3").check();
  }

  if (translate) {
    await page.getByRole("button", { name: "Translate to English" }).click();
    await expect(
      page.getByText(
        "English is ready to review. Edit it as needed before saving.",
      ),
    ).toBeVisible();
  }

  await page
    .getByLabel("English prompt translation")
    .fill(`Question ${index} ${marker}`);
  await page.getByLabel("English option 1").fill(`Correct ${index}A ${marker}`);
  await page.getByLabel("English option 2").fill(`Wrong ${index} ${marker}`);
  if (multiple) {
    await page.getByLabel("English option 3").fill(`Correct ${index}B ${marker}`);
  }
  if (image) {
    await page
      .getByLabel("Question Image", { exact: true })
      .setInputFiles(questionImage);
  }

  await page.getByRole("button", { name: "Save Question" }).click();
  await expect(page).toHaveURL(new RegExp(`${quizPath}$`));
  await expect(
    page.getByText(norwegianPrompt(index, marker), { exact: true }),
  ).toBeVisible();
}

function studyPrompt(page: Page) {
  return page
    .locator("main section")
    .first()
    .locator(":scope > p, :scope > div > p")
    .first();
}

async function currentQuestionIndex(page: Page) {
  const prompt = await studyPrompt(page).textContent();
  const match = prompt?.match(/^Spørsmål (\d+) /u);
  if (!match) throw new Error(`Could not identify Quiz Question: ${prompt}`);
  return Number(match[1]);
}

async function selectCorrectAnswer(page: Page, marker: string, index: number) {
  const optionName = (suffix = "A") => new RegExp(
    correctOption(index, marker, suffix).replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"),
    "u",
  );
  await page.getByLabel(optionName()).check();
  if (index === 1) {
    await page
      .getByLabel(optionName("B"))
      .check();
  }
}

async function submitQuizAnswer(page: Page) {
  await page.getByRole("button", { name: "Submit answer" }).click();
}

test("phone Quiz journey covers providers, feedback, Retry Gap, and durable progress", async ({
  page,
  runMarker,
}) => {
  const quizPath = await createCollection(page, runMarker, "Quiz");
  await addQuestion(page, quizPath, runMarker, 1, {
    image: true,
    multiple: true,
    translate: true,
  });

  await page.getByRole("link", { name: "Study Quiz" }).click();
  await expect(page.getByRole("img", { name: "Question Image" })).toBeVisible();
  await page.getByRole("button", { name: "Translation Help" }).click();
  await expect(
    page.getByText(`Question 1 ${runMarker}`, { exact: true }),
  ).toBeVisible();
  await selectCorrectAnswer(page, runMarker, 1);
  await submitQuizAnswer(page);
  await expect(page.getByText("Incorrect", { exact: true })).toBeVisible();
  await expect(page.getByText("Translation Help used")).toBeVisible();
  await page.getByRole("button", { name: "Next Question" }).click();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await selectCorrectAnswer(page, runMarker, 1);
    await submitQuizAnswer(page);
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Next Question" }).click();
  }

  await page.goto(quizPath);
  await expect(page.getByText("Quiz Progress: 100% Learned")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Recall Streak 3/3")).toBeVisible();

  for (let index = 2; index <= 4; index += 1) {
    await addQuestion(page, quizPath, runMarker, index);
  }

  await page.goto(`${quizPath}/study`);
  const retryQuestionIndex = await currentQuestionIndex(page);
  const retryPrompt = norwegianPrompt(retryQuestionIndex, runMarker);
  await page
    .getByLabel(`Feil ${retryQuestionIndex} ${runMarker}`, { exact: true })
    .check();
  await submitQuizAnswer(page);
  await expect(page.getByText("Incorrect", { exact: true })).toBeVisible();
  await expect(page.getByText("Your incorrect selection")).toBeVisible();
  await expect(page.getByText("Correct answer").first()).toBeVisible();
  await page.getByRole("button", { name: "Next Question" }).click();

  for (let gap = 0; gap < 3; gap += 1) {
    await expect(studyPrompt(page)).not.toHaveText(retryPrompt);
    const index = await currentQuestionIndex(page);
    await selectCorrectAnswer(page, runMarker, index);
    await submitQuizAnswer(page);
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Next Question" }).click();
  }

  await page.goto(quizPath);
  const progress = page.getByText(/Quiz Progress: \d+% Learned/u);
  const persistedProgress = await progress.textContent();
  expect(persistedProgress).not.toBeNull();
  await page.reload();
  await expect(page.getByText(persistedProgress ?? "")).toBeVisible();
});
