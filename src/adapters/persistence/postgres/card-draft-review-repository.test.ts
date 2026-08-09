import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCardDraftReviewService } from "../../../application/draft-review";
import { createDrizzleCardDraftReviewRepository } from "./card-draft-review-repository";
import { createDrizzleFlashcardRepository } from "./flashcard-repository";
import { createDrizzleGenerationRepository } from "./generation-repository";

describe("PostgreSQL Card Draft review persistence", () => {
  let client: PGlite;

  beforeEach(async () => {
    client = await PGlite.create();
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  });

  afterEach(async () => {
    await client.close();
  });

  it("atomically approves a Card Draft into a source-traceable Flashcard", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource(
      "Drosjesjåføren skal opptre høflig.",
    );
    const completed = await generation.completeGeneration(source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );

    const approval = await reviews.approve(source.id, completed.drafts[0].id, {
      front: "å opptre høflig",
      back: "to behave politely",
    });

    expect(approval).toMatchObject({
      draft: {
        reviewStatus: "approved",
        approvedFlashcardId: approval.flashcard.id,
      },
      flashcard: {
        front: "å opptre høflig",
        back: "to behave politely",
        recallStreak: 0,
        sourceTextId: source.id,
      },
    });
    expect(await generation.getSourceWithDrafts(source.id)).toMatchObject({
      drafts: [
        {
          reviewStatus: "approved",
          approvedFlashcardId: approval.flashcard.id,
        },
      ],
    });
  });

  it("returns one Flashcard when approval is submitted twice", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource("Han er høflig.");
    const completed = await generation.completeGeneration(source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );

    const first = await reviews.approve(source.id, completed.drafts[0].id, {
      front: "høflig",
      back: "polite",
    });
    const repeated = await reviews.approve(source.id, completed.drafts[0].id, {
      front: "høflig",
      back: "polite",
    });

    expect(repeated).toEqual(first);
    expect(await createDrizzleFlashcardRepository(database).list()).toHaveLength(
      1,
    );
  });

  it("persists draft edits without creating a Flashcard", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource("Han er høflig.");
    const completed = await generation.completeGeneration(source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );

    await reviews.update(source.id, completed.drafts[0].id, {
      front: "å opptre høflig",
      back: "to behave politely",
    });

    expect(await generation.getSourceWithDrafts(source.id)).toMatchObject({
      drafts: [
        {
          front: "å opptre høflig",
          back: "to behave politely",
          reviewStatus: "pending",
        },
      ],
    });
    expect(await createDrizzleFlashcardRepository(database).list()).toEqual([]);
  });

  it("persists rejection without creating a Flashcard", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource("Han er høflig.");
    const completed = await generation.completeGeneration(source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );

    await reviews.reject(source.id, completed.drafts[0].id);

    expect(await generation.getSourceWithDrafts(source.id)).toMatchObject({
      drafts: [{ reviewStatus: "rejected" }],
    });
    expect(await createDrizzleFlashcardRepository(database).list()).toEqual([]);
  });

  it("retains an approved Card Draft when its Flashcard is later deleted", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource("Han er høflig.");
    const completed = await generation.completeGeneration(source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );
    const approval = await reviews.approve(source.id, completed.drafts[0].id, {
      front: "høflig",
      back: "polite",
    });

    await createDrizzleFlashcardRepository(database).delete(
      approval.flashcard.id,
    );

    expect(await generation.getSourceWithDrafts(source.id)).toMatchObject({
      drafts: [
        { reviewStatus: "approved", approvedFlashcardId: null },
      ],
    });
  });

  it("adds every remaining Card Draft while excluding removed drafts", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource("Han er høflig og rolig.");
    const completed = await generation.completeGeneration(source.id, [
      { front: "høflig", back: "polite" },
      { front: "rolig", back: "calm" },
      { front: "Han er rolig.", back: "He is calm." },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );
    await reviews.update(source.id, completed.drafts[0].id, {
      front: "å være høflig",
      back: "to be polite",
    });
    await reviews.reject(source.id, completed.drafts[1].id);

    const approvals = await reviews.approveRemaining(source.id);

    expect(approvals.map(({ flashcard }) => flashcard)).toMatchObject([
      {
        front: "å være høflig",
        back: "to be polite",
        sourceTextId: source.id,
      },
      {
        front: "Han er rolig.",
        back: "He is calm.",
        sourceTextId: source.id,
      },
    ]);
    expect(await createDrizzleFlashcardRepository(database).list()).toHaveLength(
      2,
    );
    expect(await reviews.approveRemaining(source.id)).toEqual([]);
    expect(await createDrizzleFlashcardRepository(database).list()).toHaveLength(
      2,
    );
  });

  it("does not mutate a Card Draft through a different Source Text", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const firstSource = await generation.createSource("Han er høflig.");
    const secondSource = await generation.createSource("Hun er rolig.");
    const secondCompleted = await generation.completeGeneration(
      secondSource.id,
      [{ front: "rolig", back: "calm" }],
    );
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );

    await expect(
      reviews.update(firstSource.id, secondCompleted.drafts[0].id, {
        front: "endret",
        back: "changed",
      }),
    ).rejects.toMatchObject({ name: "CardDraftUnavailableError" });
    expect(await generation.getSourceWithDrafts(secondSource.id)).toMatchObject({
      drafts: [{ front: "rolig", back: "calm", reviewStatus: "pending" }],
    });
  });
});
