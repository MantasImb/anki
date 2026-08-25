CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quizzes_name_key_unique" UNIQUE("name_key"),
	CONSTRAINT "quizzes_name_not_blank" CHECK (length(regexp_replace("quizzes"."name", '[[:space:]]', '', 'g')) > 0)
);
