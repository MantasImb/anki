ALTER TABLE "study_results" DROP CONSTRAINT "study_results_flashcard_id_flashcards_id_fk";
--> statement-breakpoint
ALTER TABLE "study_results" ALTER COLUMN "flashcard_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "study_results" ADD CONSTRAINT "study_results_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE set null ON UPDATE no action;