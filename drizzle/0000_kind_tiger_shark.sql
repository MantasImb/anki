CREATE TABLE "flashcards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"recall_streak" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flashcards_front_not_blank" CHECK (length(regexp_replace("flashcards"."front", '[[:space:]]', '', 'g')) > 0),
	CONSTRAINT "flashcards_back_not_blank" CHECK (length(regexp_replace("flashcards"."back", '[[:space:]]', '', 'g')) > 0)
);
