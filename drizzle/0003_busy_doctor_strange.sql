CREATE TABLE "generation_instructions" (
	"id" text PRIMARY KEY NOT NULL,
	"instructions" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
