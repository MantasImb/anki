CREATE TABLE "card_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_text_id" uuid NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "card_drafts_front_not_blank" CHECK (length(regexp_replace("card_drafts"."front", '[[:space:]]', '', 'g')) > 0),
	CONSTRAINT "card_drafts_back_not_blank" CHECK (length(regexp_replace("card_drafts"."back", '[[:space:]]', '', 'g')) > 0),
	CONSTRAINT "card_drafts_review_status_valid" CHECK ("card_drafts"."review_status" in ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "source_texts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"generation_status" text DEFAULT 'ready' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_texts_content_not_blank" CHECK (length(regexp_replace("source_texts"."content", '[[:space:]]', '', 'g')) > 0),
	CONSTRAINT "source_texts_generation_status_valid" CHECK ("source_texts"."generation_status" in ('ready', 'completed', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "card_drafts" ADD CONSTRAINT "card_drafts_source_text_id_source_texts_id_fk" FOREIGN KEY ("source_text_id") REFERENCES "public"."source_texts"("id") ON DELETE cascade ON UPDATE no action;