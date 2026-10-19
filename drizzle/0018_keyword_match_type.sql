-- Keyword rules get a match type: 'exact' matches the whole normalized description, 'fuzzy' keeps the previous word-level matching. The runner applies the file and its ledger row in one implicit transaction; every statement is still safe to rerun by hand (IF NOT EXISTS, DROP CONSTRAINT IF EXISTS).
-- ADD COLUMN with a constant default is metadata-only in PostgreSQL 11+: existing rows read as 'fuzzy' and keep their behaviour without a table rewrite.
ALTER TABLE "keyword_mapping" ADD COLUMN IF NOT EXISTS "matchType" text DEFAULT 'fuzzy' NOT NULL;
--> statement-breakpoint
ALTER TABLE "shared_budget_keyword_mapping" ADD COLUMN IF NOT EXISTS "matchType" text DEFAULT 'fuzzy' NOT NULL;
--> statement-breakpoint
ALTER TABLE "keyword_mapping" DROP CONSTRAINT IF EXISTS "keyword_mapping_match_type_check";
--> statement-breakpoint
ALTER TABLE "keyword_mapping" ADD CONSTRAINT "keyword_mapping_match_type_check" CHECK ("matchType" IN ('exact', 'fuzzy')) NOT VALID;
--> statement-breakpoint
ALTER TABLE "shared_budget_keyword_mapping" DROP CONSTRAINT IF EXISTS "shared_budget_keyword_mapping_match_type_check";
--> statement-breakpoint
ALTER TABLE "shared_budget_keyword_mapping" ADD CONSTRAINT "shared_budget_keyword_mapping_match_type_check" CHECK ("matchType" IN ('exact', 'fuzzy')) NOT VALID;
