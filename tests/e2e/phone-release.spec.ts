import { randomUUID } from "node:crypto";
import { expect, test as base, type Dialog, type Page } from "@playwright/test";

async function deleteFlashcardsByMarker(page: Page, marker: string) {
  await page.goto("/cards");
  const matchingCards = page.locator("main li").filter({ hasText: marker });

  const acceptDeletion = (dialog: Dialog) => dialog.accept();
  page.on("dialog", acceptDeletion);

  try {
    while ((await matchingCards.count()) > 0) {
      await matchingCards
        .first()
        .getByRole("link", { name: "Edit Flashcard" })
        .click();
      await page.getByRole("button", { name: "Delete Flashcard" }).click();
      await expect(page).toHaveURL(/\/cards$/);
    }
  } finally {
    page.off("dialog", acceptDeletion);
  }

  await expect(matchingCards).toHaveCount(0);
}

const test = base.extend<{ runMarker: string }>({
  runMarker: async ({ page }, provide) => {
    const marker = `e2e-${randomUUID()}`;
    await provide(marker);
    await deleteFlashcardsByMarker(page, marker);
  },
});

async function addManualFlashcard(page: Page, front: string, back: string) {
  await page.goto("/cards/new");
  await page.getByLabel("Norwegian Front").fill(front);
  await page.getByLabel("English Back").fill(back);
  await page.getByRole("button", { name: "Save Flashcard" }).click();
  await expect(page).toHaveURL(/\/cards$/);
}

function studyFront(page: Page) {
  return page.locator("main section").first().locator(":scope > p").nth(1);
}

async function answer(page: Page, assessment: "Correct" | "Incorrect") {
  await page.getByRole("button", { name: "Reveal English Back" }).click();
  await page
    .getByRole("button", { name: assessment, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reveal English Back" }),
  ).toBeVisible();
}

test("one curriculum unit becomes editable cards and a retry-gapped study session", async ({
  page,
  runMarker,
}) => {
  const targetFront = `fase åtte mål ${runMarker}`;
  const targetBack = `phase eight target ${runMarker}`;

  for (const [position, translation] of [
    ["første alternativ", "first alternative"],
    ["andre alternativ", "second alternative"],
    ["tredje alternativ", "third alternative"],
    ["fjerde alternativ", "fourth alternative"],
  ]) {
    await addManualFlashcard(
      page,
      `${position} ${runMarker}`,
      `${translation} ${runMarker}`,
    );
  }

  await page.goto("/generate");
  await page.getByLabel("Norwegian Source Text").fill(
    [
      "Bilen er rød.",
      "Huset er stort.",
      "Eleven leser en bok.",
      "Læreren skriver på tavla.",
      "Vi øver på norsk hver dag.",
      `Fase åtte mål ${runMarker} er klart.`,
    ].join(" "),
  );
  await page.getByRole("button", { name: "Generate Card Drafts" }).click();
  await expect(page).toHaveURL(/\/sources\/[^/]+\/drafts$/);

  const frontFields = page.getByLabel("Norwegian Front");
  const backFields = page.getByLabel("English Back");
  const draftCount = await frontFields.count();

  for (let index = 0; index < draftCount; index += 1) {
    const front = frontFields.nth(index);
    await front.fill(
      index === 0 ? targetFront : `${await front.inputValue()} ${runMarker}`,
    );
    if (index === 0) {
      await backFields.first().fill(targetBack);
    }
    await page.getByRole("button", { name: "Save edits" }).nth(index).click();
    await expect(page.getByText("Card Draft edits saved.").nth(index))
      .toBeVisible();
  }
  await page
    .getByRole("button", { name: /Add \d+ Flashcards?/ })
    .click();
  await expect(page).toHaveURL(/\/cards$/);
  const storedTarget = page.locator("main li").filter({ hasText: targetFront });
  await expect(storedTarget.getByText(targetFront, { exact: true }))
    .toBeVisible();
  await expect(storedTarget.getByText(targetBack, { exact: true }))
    .toBeVisible();

  await page.goto("/study");
  const retryFront = await studyFront(page).textContent();
  expect(retryFront).not.toBeNull();
  await page.getByRole("button", { name: "Reveal English Back" }).click();
  await page.getByRole("button", { name: "Incorrect" }).click();
  await expect(
    page.getByRole("button", { name: "Reveal English Back" }),
  ).toBeVisible();

  for (let gap = 0; gap < 3; gap += 1) {
    await expect(studyFront(page)).not.toHaveText(retryFront ?? "");
    await answer(page, "Correct");
  }
});
