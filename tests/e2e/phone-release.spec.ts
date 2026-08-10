import { expect, test, type Page } from "@playwright/test";

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
  await page.getByRole("button", { name: assessment }).click();
  await expect(
    page.getByRole("button", { name: "Reveal English Back" }),
  ).toBeVisible();
}

test("one curriculum unit becomes editable cards and a retry-gapped study session", async ({
  page,
}) => {
  const run = Date.now().toString(36);
  const targetFront = `fase åtte mål ${run}`;
  const targetBack = `phase eight target ${run}`;

  for (const [position, translation] of [
    ["første alternativ", "first alternative"],
    ["andre alternativ", "second alternative"],
    ["tredje alternativ", "third alternative"],
    ["fjerde alternativ", "fourth alternative"],
  ]) {
    await addManualFlashcard(
      page,
      `${position} ${run}`,
      `${translation} ${run}`,
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
      `Fase åtte mål ${run} er klart.`,
    ].join(" "),
  );
  await page.getByRole("button", { name: "Generate Card Drafts" }).click();
  await expect(page).toHaveURL(/\/sources\/[^/]+\/drafts$/);

  await page.getByLabel("Norwegian Front").first().fill(targetFront);
  await page.getByLabel("English Back").first().fill(targetBack);
  await page.getByRole("button", { name: "Save edits" }).first().click();
  await expect(page.getByText("Card Draft edits saved.").first()).toBeVisible();
  await page
    .getByRole("button", { name: /Add \d+ Flashcards?/ })
    .click();
  await expect(page).toHaveURL(/\/cards$/);
  await expect(page.getByText(targetFront, { exact: true })).toBeVisible();

  await page.goto("/study");
  let foundTarget = false;
  for (let position = 0; position < 80; position += 1) {
    if ((await studyFront(page).textContent()) === targetFront) {
      foundTarget = true;
      break;
    }
    await answer(page, "Correct");
  }
  expect(foundTarget, "generated Flashcard should enter study").toBe(true);

  await page.getByRole("button", { name: "Reveal English Back" }).click();
  await expect(page.getByText(targetBack, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Incorrect" }).click();
  await expect(
    page.getByRole("button", { name: "Reveal English Back" }),
  ).toBeVisible();

  for (let gap = 0; gap < 3; gap += 1) {
    await expect(studyFront(page)).not.toHaveText(targetFront);
    await answer(page, "Correct");
  }

  let returnedAfterGap = false;
  for (let position = 0; position < 80; position += 1) {
    if ((await studyFront(page).textContent()) === targetFront) {
      returnedAfterGap = true;
      break;
    }
    await answer(page, "Correct");
  }
  expect(
    returnedAfterGap,
    "incorrect Flashcard should become eligible after three alternatives",
  ).toBe(true);
});
