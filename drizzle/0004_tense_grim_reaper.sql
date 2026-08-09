ALTER TABLE "card_drafts" ADD COLUMN "approved_flashcard_id" uuid;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "source_text_id" uuid;--> statement-breakpoint
ALTER TABLE "card_drafts" ADD CONSTRAINT "card_drafts_approved_flashcard_id_flashcards_id_fk" FOREIGN KEY ("approved_flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_source_text_id_source_texts_id_fk" FOREIGN KEY ("source_text_id") REFERENCES "public"."source_texts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_drafts" ADD CONSTRAINT "card_drafts_approved_flashcard_id_unique" UNIQUE("approved_flashcard_id");
