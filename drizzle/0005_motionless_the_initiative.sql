CREATE TABLE "study_results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"flashcard_id" uuid NOT NULL,
	"assessment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_results_assessment_valid" CHECK ("study_results"."assessment" in ('correct', 'incorrect'))
);
--> statement-breakpoint
ALTER TABLE "study_results" ADD CONSTRAINT "study_results_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_recall_streak_valid" CHECK ("flashcards"."recall_streak" between 0 and 3);