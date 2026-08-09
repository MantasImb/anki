import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const sourceTexts = pgTable(
  "source_texts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    generationStatus: text("generation_status")
      .$type<"ready" | "completed" | "failed">()
      .default("ready")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "source_texts_content_not_blank",
      sql`length(regexp_replace(${table.content}, '[[:space:]]', '', 'g')) > 0`,
    ),
    check(
      "source_texts_generation_status_valid",
      sql`${table.generationStatus} in ('ready', 'completed', 'failed')`,
    ),
  ],
);

export const flashcards = pgTable(
  "flashcards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceTextId: uuid("source_text_id").references(() => sourceTexts.id),
    front: text("front").notNull(),
    back: text("back").notNull(),
    recallStreak: integer("recall_streak").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "flashcards_front_not_blank",
      sql`length(regexp_replace(${table.front}, '[[:space:]]', '', 'g')) > 0`,
    ),
    check(
      "flashcards_back_not_blank",
      sql`length(regexp_replace(${table.back}, '[[:space:]]', '', 'g')) > 0`,
    ),
  ],
);

export const generationInstructions = pgTable("generation_instructions", {
  id: text("id").primaryKey(),
  instructions: text("instructions").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const cardDrafts = pgTable(
  "card_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceTextId: uuid("source_text_id")
      .notNull()
      .references(() => sourceTexts.id, { onDelete: "cascade" }),
    front: text("front").notNull(),
    back: text("back").notNull(),
    position: integer("position").notNull(),
    reviewStatus: text("review_status")
      .$type<"pending" | "approved" | "rejected">()
      .default("pending")
      .notNull(),
    approvedFlashcardId: uuid("approved_flashcard_id")
      .unique()
      .references(() => flashcards.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "card_drafts_front_not_blank",
      sql`length(regexp_replace(${table.front}, '[[:space:]]', '', 'g')) > 0`,
    ),
    check(
      "card_drafts_back_not_blank",
      sql`length(regexp_replace(${table.back}, '[[:space:]]', '', 'g')) > 0`,
    ),
    check(
      "card_drafts_review_status_valid",
      sql`${table.reviewStatus} in ('pending', 'approved', 'rejected')`,
    ),
  ],
);
