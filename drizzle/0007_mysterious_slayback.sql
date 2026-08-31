CREATE TABLE "flashcard_decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flashcard_decks_name_key_unique" UNIQUE("name_key"),
	CONSTRAINT "flashcard_decks_name_not_blank" CHECK (length(regexp_replace("flashcard_decks"."name", '[[:space:]]', '', 'g')) > 0)
);
