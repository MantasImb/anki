import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCollectionService } from "../../../application/collections";
import { createCardDraftReviewService } from "../../../application/draft-review";
import { createDrizzleFlashcardDeckRepository } from "./collection-repository";
import { createDrizzleCardDraftReviewRepository } from "./card-draft-review-repository";
import { createDrizzleFlashcardRepository } from "./flashcard-repository";
import { createDrizzleGenerationRepository } from "./generation-repository";
import * as schema from "./schema";

describe("PostgreSQL Card Draft review persistence", () => {
  let client: PGlite;
  let deckId: string;

  beforeEach(async () => {
    client = await PGlite.create();
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
    deckId = (
      await createCollectionService(
        "Flashcard Deck",
        createDrizzleFlashcardDeckRepository(drizzle(client)),
      ).create({ name: "Generated cards" })
    ).id;
  });

  afterEach(async () => {
    await client.close();
  });

  it("atomically approves a Card Draft into a source-traceable Flashcard", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource(
      deckId,
      "Drosjesjåføren skal opptre høflig.",
    );
    const completed = await generation.completeGeneration(deckId, source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );

    const approval = await reviews.approve(deckId, source.id, completed.drafts[0].id, {
      front: "å opptre høflig",
      back: "to behave politely",
    });

    expect(approval).toMatchObject({
      draft: {
        reviewStatus: "approved",
        approvedFlashcardId: approval.flashcard.id,
      },
      flashcard: {
        deckId,
        front: "å opptre høflig",
        back: "to behave politely",
        recallStreak: 0,
        sourceTextId: source.id,
      },
    });
    expect(await generation.getSourceWithDrafts(deckId, source.id)).toMatchObject({
      drafts: [
        {
          reviewStatus: "approved",
          approvedFlashcardId: approval.flashcard.id,
        },
      ],
    });
  });

  it("cannot approve a Card Draft into a different Deck", async () => {
    const database = drizzle(client);
    const otherDeckId = (
      await createCollectionService(
        "Flashcard Deck",
        createDrizzleFlashcardDeckRepository(database),
      ).create({ name: "Other Deck" })
    ).id;
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource(
      deckId,
      "Drosjesjåføren skal opptre høflig.",
    );
    const completed = await generation.completeGeneration(deckId, source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );

    await expect(
      reviews.approve(
        otherDeckId,
        source.id,
        completed.drafts[0].id,
        { front: "høflig", back: "polite" },
      ),
    ).rejects.toThrow("Card Draft is no longer available for review.");
    expect(await createDrizzleFlashcardRepository(database).list(deckId)).toEqual(
      [],
    );
    expect(
      await createDrizzleFlashcardRepository(database).list(otherDeckId),
    ).toEqual([]);
  });

  it("rejects source traceability that does not match Flashcard Deck ownership", async () => {
    const database = drizzle(client);
    const otherDeckId = (
      await createCollectionService(
        "Flashcard Deck",
        createDrizzleFlashcardDeckRepository(database),
      ).create({ name: "Other Deck" })
    ).id;
    const source = await createDrizzleGenerationRepository(database).createSource(
      deckId,
      "Han er høflig.",
    );

    await expect(
      database.insert(schema.flashcards).values({
        deckId: otherDeckId,
        sourceTextId: source.id,
        front: "høflig",
        back: "polite",
      }),
    ).rejects.toThrow();
  });

  it("returns one Flashcard when approval is submitted twice", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource(deckId, "Han er høflig.");
    const completed = await generation.completeGeneration(deckId, source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );

    const first = await reviews.approve(deckId, source.id, completed.drafts[0].id, {
      front: "høflig",
      back: "polite",
    });
    const repeated = await reviews.approve(deckId, source.id, completed.drafts[0].id, {
      front: "høflig",
      back: "polite",
    });

    expect(repeated).toEqual(first);
    expect(await createDrizzleFlashcardRepository(database).list(deckId)).toHaveLength(
      1,
    );
  });

  it("cannot move an approved Flashcard by repeating approval from another Deck", async () => {
    const database = drizzle(client);
    const otherDeckId = (
      await createCollectionService(
        "Flashcard Deck",
        createDrizzleFlashcardDeckRepository(database),
      ).create({ name: "Wrong target" })
    ).id;
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource(deckId, "Han er høflig.");
    const completed = await generation.completeGeneration(deckId, source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );
    await reviews.approve(deckId, source.id, completed.drafts[0].id, {
      front: "høflig",
      back: "polite",
    });

    await expect(
      reviews.approve(otherDeckId, source.id, completed.drafts[0].id, {
        front: "høflig",
        back: "polite",
      }),
    ).rejects.toThrow("Card Draft is no longer available for review.");
    expect(await createDrizzleFlashcardRepository(database).list(deckId)).toHaveLength(
      1,
    );
    expect(
      await createDrizzleFlashcardRepository(database).list(otherDeckId),
    ).toEqual([]);
  });

  it("persists draft edits without creating a Flashcard", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource(deckId, "Han er høflig.");
    const completed = await generation.completeGeneration(deckId, source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );

    await reviews.update(deckId, source.id, completed.drafts[0].id, {
      front: "å opptre høflig",
      back: "to behave politely",
    });

    expect(await generation.getSourceWithDrafts(deckId, source.id)).toMatchObject({
      drafts: [
        {
          front: "å opptre høflig",
          back: "to behave politely",
          reviewStatus: "pending",
        },
      ],
    });
    expect(await createDrizzleFlashcardRepository(database).list(deckId)).toEqual([]);
  });

  it("persists rejection without creating a Flashcard", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource(deckId, "Han er høflig.");
    const completed = await generation.completeGeneration(deckId, source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );

    await reviews.reject(deckId, source.id, completed.drafts[0].id);

    expect(await generation.getSourceWithDrafts(deckId, source.id)).toMatchObject({
      drafts: [{ reviewStatus: "rejected" }],
    });
    expect(await createDrizzleFlashcardRepository(database).list(deckId)).toEqual([]);
  });

  it("retains an approved Card Draft when its Flashcard is later deleted", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource(deckId, "Han er høflig.");
    const completed = await generation.completeGeneration(deckId, source.id, [
      { front: "høflig", back: "polite" },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );
    const approval = await reviews.approve(deckId, source.id, completed.drafts[0].id, {
      front: "høflig",
      back: "polite",
    });

    await createDrizzleFlashcardRepository(database).delete(
      deckId,
      approval.flashcard.id,
    );

    expect(await generation.getSourceWithDrafts(deckId, source.id)).toMatchObject({
      drafts: [
        { reviewStatus: "approved", approvedFlashcardId: null },
      ],
    });
  });

  it("adds every remaining Card Draft while excluding removed drafts", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const source = await generation.createSource(
      deckId,
      "Han er høflig og rolig.",
    );
    const completed = await generation.completeGeneration(deckId, source.id, [
      { front: "høflig", back: "polite" },
      { front: "rolig", back: "calm" },
      { front: "Han er rolig.", back: "He is calm." },
    ]);
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );
    await reviews.update(deckId, source.id, completed.drafts[0].id, {
      front: "å være høflig",
      back: "to be polite",
    });
    await reviews.reject(deckId, source.id, completed.drafts[1].id);

    const approvals = await reviews.approveRemaining(deckId, source.id);

    expect(approvals.map(({ flashcard }) => flashcard)).toMatchObject([
      {
        deckId,
        front: "å være høflig",
        back: "to be polite",
        sourceTextId: source.id,
      },
      {
        deckId,
        front: "Han er rolig.",
        back: "He is calm.",
        sourceTextId: source.id,
      },
    ]);
    expect(await createDrizzleFlashcardRepository(database).list(deckId)).toHaveLength(
      2,
    );
    expect(await reviews.approveRemaining(deckId, source.id)).toEqual([]);
    expect(await createDrizzleFlashcardRepository(database).list(deckId)).toHaveLength(
      2,
    );
  });

  it("does not mutate a Card Draft through a different Source Text", async () => {
    const database = drizzle(client);
    const generation = createDrizzleGenerationRepository(database);
    const firstSource = await generation.createSource(deckId, "Han er høflig.");
    const secondSource = await generation.createSource(deckId, "Hun er rolig.");
    const secondCompleted = await generation.completeGeneration(
      deckId,
      secondSource.id,
      [{ front: "rolig", back: "calm" }],
    );
    const reviews = createCardDraftReviewService(
      createDrizzleCardDraftReviewRepository(database),
    );

    await expect(
      reviews.update(deckId, firstSource.id, secondCompleted.drafts[0].id, {
        front: "endret",
        back: "changed",
      }),
    ).rejects.toMatchObject({ name: "CardDraftUnavailableError" });
    expect(
      await generation.getSourceWithDrafts(deckId, secondSource.id),
    ).toMatchObject({
      drafts: [{ front: "rolig", back: "calm", reviewStatus: "pending" }],
    });
  });
});
