ALTER TABLE "source_texts" ADD CONSTRAINT "source_texts_id_deck_id_unique" UNIQUE("id","deck_id");--> statement-breakpoint
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_source_text_deck_match_fk" FOREIGN KEY ("source_text_id","deck_id") REFERENCES "public"."source_texts"("id","deck_id") ON DELETE no action ON UPDATE no action;
