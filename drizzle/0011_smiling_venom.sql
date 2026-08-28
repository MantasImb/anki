CREATE TABLE "answer_options" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question_id" uuid NOT NULL,
	"norwegian" text NOT NULL,
	"english" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "answer_options_question_position_unique" UNIQUE("question_id","position"),
	CONSTRAINT "answer_options_norwegian_not_blank" CHECK (length(regexp_replace("answer_options"."norwegian", '[[:space:]]', '', 'g')) > 0),
	CONSTRAINT "answer_options_english_not_blank" CHECK (length(regexp_replace("answer_options"."english", '[[:space:]]', '', 'g')) > 0),
	CONSTRAINT "answer_options_position_valid" CHECK ("answer_options"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quiz_id" uuid NOT NULL,
	"prompt_norwegian" text NOT NULL,
	"prompt_english" text NOT NULL,
	"recall_streak" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_questions_prompt_norwegian_not_blank" CHECK (length(regexp_replace("quiz_questions"."prompt_norwegian", '[[:space:]]', '', 'g')) > 0),
	CONSTRAINT "quiz_questions_prompt_english_not_blank" CHECK (length(regexp_replace("quiz_questions"."prompt_english", '[[:space:]]', '', 'g')) > 0),
	CONSTRAINT "quiz_questions_recall_streak_valid" CHECK ("quiz_questions"."recall_streak" between 0 and 3)
);
--> statement-breakpoint
ALTER TABLE "answer_options" ADD CONSTRAINT "answer_options_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;