CREATE TABLE "question_image_cleanup" (
	"object_key" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_image_uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"object_key" text NOT NULL,
	"original_name" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_image_uploads_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "question_image_uploads_content_type_valid" CHECK ("question_image_uploads"."content_type" in ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
	CONSTRAINT "question_image_uploads_byte_size_valid" CHECK ("question_image_uploads"."byte_size" between 1 and 26214400),
	CONSTRAINT "question_image_uploads_status_valid" CHECK ("question_image_uploads"."status" in ('pending', 'completed', 'attached'))
);
--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD COLUMN "image_object_key" text;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD COLUMN "image_original_name" text;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD COLUMN "image_content_type" text;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD COLUMN "image_byte_size" integer;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_image_object_key_unique" UNIQUE("image_object_key");--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_image_metadata_complete" CHECK (("quiz_questions"."image_object_key" is null and "quiz_questions"."image_original_name" is null and "quiz_questions"."image_content_type" is null and "quiz_questions"."image_byte_size" is null) or ("quiz_questions"."image_object_key" is not null and "quiz_questions"."image_original_name" is not null and "quiz_questions"."image_content_type" in ('image/jpeg', 'image/png', 'image/webp', 'image/gif') and "quiz_questions"."image_byte_size" between 1 and 26214400));