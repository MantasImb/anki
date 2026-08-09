ALTER TABLE "card_drafts" ADD COLUMN "position" integer;
--> statement-breakpoint
WITH "ordered_drafts" AS (
	SELECT
		"id",
		row_number() OVER (
			PARTITION BY "source_text_id"
			ORDER BY "created_at", "id"
		) - 1 AS "position"
	FROM "card_drafts"
)
UPDATE "card_drafts"
SET "position" = "ordered_drafts"."position"
FROM "ordered_drafts"
WHERE "card_drafts"."id" = "ordered_drafts"."id";
--> statement-breakpoint
ALTER TABLE "card_drafts" ALTER COLUMN "position" SET NOT NULL;
