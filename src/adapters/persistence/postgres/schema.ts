import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const flashcardDecks = pgTable(
  "flashcard_decks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    nameKey: text("name_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "flashcard_decks_name_not_blank",
      sql`length(regexp_replace(${table.name}, '[[:space:]]', '', 'g')) > 0`,
    ),
    unique("flashcard_decks_name_key_unique").on(table.nameKey),
  ],
);

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    nameKey: text("name_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "quizzes_name_not_blank",
      sql`length(regexp_replace(${table.name}, '[[:space:]]', '', 'g')) > 0`,
    ),
    unique("quizzes_name_key_unique").on(table.nameKey),
  ],
);

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
    check(
      "flashcards_recall_streak_valid",
      sql`${table.recallStreak} between 0 and 3`,
    ),
  ],
);

export const studyResults = pgTable(
  "study_results",
  {
    id: uuid("id").primaryKey(),
    flashcardId: uuid("flashcard_id").references(() => flashcards.id, {
      onDelete: "set null",
    }),
    assessment: text("assessment")
      .$type<"correct" | "incorrect">()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "study_results_assessment_valid",
      sql`${table.assessment} in ('correct', 'incorrect')`,
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
