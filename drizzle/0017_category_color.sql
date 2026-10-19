-- Categories get an optional palette color. The runner applies the file and its ledger row in one implicit transaction; every statement is still safe to rerun by hand (IF NOT EXISTS, DROP CONSTRAINT IF EXISTS).
-- The CHECK constraints are added NOT VALID: existing rows have no color and are not scanned; new and updated rows are checked.
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "color" text;
--> statement-breakpoint
ALTER TABLE "shared_budget_category" ADD COLUMN IF NOT EXISTS "color" text;
--> statement-breakpoint
ALTER TABLE "category" DROP CONSTRAINT IF EXISTS "category_color_check";
--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_color_check" CHECK ("color" IS NULL OR "color" ~ '^#[0-9a-f]{6}$') NOT VALID;
--> statement-breakpoint
ALTER TABLE "shared_budget_category" DROP CONSTRAINT IF EXISTS "shared_budget_category_color_check";
--> statement-breakpoint
ALTER TABLE "shared_budget_category" ADD CONSTRAINT "shared_budget_category_color_check" CHECK ("color" IS NULL OR "color" ~ '^#[0-9a-f]{6}$') NOT VALID;
