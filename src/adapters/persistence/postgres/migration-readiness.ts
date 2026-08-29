export type ExpectedMigration = {
  tag: string;
  when: number;
};

const tables = [
  "answer_options",
  "card_drafts",
  "flashcard_decks",
  "flashcards",
  "generation_instructions",
  "question_image_cleanup",
  "question_image_uploads",
  "quizzes",
  "quiz_questions",
  "source_texts",
  "study_results",
] as const;

const columns = {
  answer_options: [
    "id",
    "question_id",
    "norwegian",
    "english",
    "is_correct",
    "position",
    "created_at",
  ],
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
  flashcard_decks: ["id", "name", "name_key", "created_at"],
  flashcards: [
    "id",
    "deck_id",
    "source_text_id",
    "front",
    "back",
    "recall_streak",
    "created_at",
  ],
  generation_instructions: ["id", "instructions", "updated_at"],
  question_image_cleanup: ["object_key", "attempts", "last_error", "created_at"],
  question_image_uploads: [
    "id",
    "object_key",
    "original_name",
    "content_type",
    "byte_size",
    "status",
    "created_at",
  ],
  quizzes: ["id", "name", "name_key", "created_at"],
  quiz_questions: [
    "id",
    "quiz_id",
    "prompt_norwegian",
    "prompt_english",
    "recall_streak",
    "image_object_key",
    "image_original_name",
    "image_content_type",
    "image_byte_size",
    "created_at",
  ],
  source_texts: [
    "id",
    "deck_id",
    "content",
    "generation_status",
    "created_at",
  ],
  study_results: ["id", "flashcard_id", "assessment", "created_at"],
} as const;

const constraints = [
  "answer_options_english_not_blank",
  "answer_options_norwegian_not_blank",
  "answer_options_position_valid",
  "answer_options_question_id_quiz_questions_id_fk",
  "answer_options_question_position_unique",
  "card_drafts_approved_flashcard_id_flashcards_id_fk",
  "card_drafts_approved_flashcard_id_unique",
  "card_drafts_back_not_blank",
  "card_drafts_front_not_blank",
  "card_drafts_review_status_valid",
  "card_drafts_source_text_id_source_texts_id_fk",
  "flashcard_decks_name_key_unique",
  "flashcard_decks_name_not_blank",
  "flashcards_back_not_blank",
  "flashcards_deck_id_flashcard_decks_id_fk",
  "flashcards_front_not_blank",
  "flashcards_recall_streak_valid",
  "flashcards_source_text_deck_match_fk",
  "flashcards_source_text_id_source_texts_id_fk",
  "quizzes_name_key_unique",
  "quizzes_name_not_blank",
  "question_image_uploads_byte_size_valid",
  "question_image_uploads_content_type_valid",
  "question_image_uploads_object_key_unique",
  "question_image_uploads_status_valid",
  "quiz_questions_image_metadata_complete",
  "quiz_questions_image_object_key_unique",
  "quiz_questions_prompt_english_not_blank",
  "quiz_questions_prompt_norwegian_not_blank",
  "quiz_questions_quiz_id_quizzes_id_fk",
  "quiz_questions_recall_streak_valid",
  "source_texts_content_not_blank",
  "source_texts_deck_id_flashcard_decks_id_fk",
  "source_texts_generation_status_valid",
  "source_texts_id_deck_id_unique",
  "study_results_assessment_valid",
  "study_results_flashcard_id_flashcards_id_fk",
] as const;

export const expectedDatabaseObjects = [
  ...tables.map((table) => `base table: ${table}`),
  ...Object.entries(columns).flatMap(([table, tableColumns]) =>
    tableColumns.map((column) => `column: ${table}.${column}`),
  ),
  ...constraints.map((constraint) => `constraint: ${constraint}`),
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
