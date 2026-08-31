CREATE TABLE "quiz_results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question_id" uuid,
	"outcome" text NOT NULL,
	"translation_help_used" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_results_outcome_valid" CHECK ("quiz_results"."outcome" in ('correct', 'incorrect'))
);
--> statement-breakpoint
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE set null ON UPDATE no action;