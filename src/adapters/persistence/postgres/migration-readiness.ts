export type ExpectedMigration = {
  tag: string;
  when: number;
};

const v1Tables = [
  "card_drafts",
  "flashcards",
  "generation_instructions",
  "source_texts",
  "study_results",
] as const;

const v1Columns = {
  card_drafts: [
    "id",
    "source_text_id",
    "front",
    "back",
    "position",
    "review_status",
    "approved_flashcard_id",
    "created_at",
  ],
  flashcards: [
    "id",
    "source_text_id",
    "front",
    "back",
    "recall_streak",
    "created_at",
  ],
  generation_instructions: ["id", "instructions", "updated_at"],
  source_texts: ["id", "content", "generation_status", "created_at"],
  study_results: ["id", "flashcard_id", "assessment", "created_at"],
} as const;

const v1Constraints = [
  "card_drafts_approved_flashcard_id_flashcards_id_fk",
  "card_drafts_approved_flashcard_id_unique",
  "card_drafts_back_not_blank",
  "card_drafts_front_not_blank",
  "card_drafts_review_status_valid",
  "card_drafts_source_text_id_source_texts_id_fk",
  "flashcards_back_not_blank",
  "flashcards_front_not_blank",
  "flashcards_recall_streak_valid",
  "flashcards_source_text_id_source_texts_id_fk",
  "source_texts_content_not_blank",
  "source_texts_generation_status_valid",
  "study_results_assessment_valid",
  "study_results_flashcard_id_flashcards_id_fk",
] as const;

export const v1ExpectedDatabaseObjects = [
  ...v1Tables.map((table) => `base table: ${table}`),
  ...Object.entries(v1Columns).flatMap(([table, columns]) =>
    columns.map((column) => `column: ${table}.${column}`),
  ),
  ...v1Constraints.map((constraint) => `constraint: ${constraint}`),
];

export function requireCompleteMigrationHistory(
  expectedMigrations: readonly ExpectedMigration[],
  appliedMigrationTimestamps: readonly string[],
) {
  const applied = new Set(appliedMigrationTimestamps);
  const missing = expectedMigrations.filter(
    ({ when }) => !applied.has(String(when)),
  );

  if (missing.length > 0) {
    throw new Error(
      `Database migration history is incomplete. Missing migrations: ${missing
        .map(({ tag }) => tag)
        .join(", ")}.`,
    );
  }
}

export function requireExpectedDatabaseObjects(
  expectedObjects: readonly string[],
  presentObjects: readonly string[],
) {
  const present = new Set(presentObjects);
  const missing = expectedObjects.filter((object) => !present.has(object));

  if (missing.length > 0) {
    throw new Error(
      `Database schema is incomplete. Missing objects: ${missing.join(", ")}.`,
    );
  }
}
