-- Money columns move from real (float4) to numeric(12,2). Every statement is safe to rerun: the runner is not atomic, so a file can partly commit before its ledger row is recorded.
-- The cast goes through double precision: a direct real::numeric cast keeps only 6 significant digits (12345.67 -> 12345.7), while float8 keeps every digit of the float4 value. On a rerun the column is already numeric(12,2) and the same cast returns the same value.
-- New CHECK constraints are dropped first, so a rerun never revalidates them during the type change, and are added NOT VALID: legacy rows are not checked, new and updated rows are.
ALTER TABLE "expense" DROP CONSTRAINT IF EXISTS "expense_amount_check";
--> statement-breakpoint
ALTER TABLE "pocket_month_budget" DROP CONSTRAINT IF EXISTS "pocket_month_budget_amount_max_check";
--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "project_budget_check";
--> statement-breakpoint
ALTER TABLE "user_settings" DROP CONSTRAINT IF EXISTS "user_settings_salary_check";
--> statement-breakpoint
ALTER TABLE "weekly_budget_limit" DROP CONSTRAINT IF EXISTS "weekly_budget_limit_amount_check";
--> statement-breakpoint
ALTER TABLE "shared_budget_weekly_limit" DROP CONSTRAINT IF EXISTS "shared_budget_weekly_limit_amount_check";
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "weeklyLimit" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "salary" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "expense" ALTER COLUMN "amount" TYPE numeric(12, 2) USING round("amount"::double precision::numeric, 2);
--> statement-breakpoint
ALTER TABLE "pocket_month_budget" ALTER COLUMN "budget" TYPE numeric(12, 2) USING round("budget"::double precision::numeric, 2);
--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "budget" TYPE numeric(12, 2) USING round("budget"::double precision::numeric, 2);
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "weeklyLimit" TYPE numeric(12, 2) USING round("weeklyLimit"::double precision::numeric, 2);
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "salary" TYPE numeric(12, 2) USING round("salary"::double precision::numeric, 2);
--> statement-breakpoint
ALTER TABLE "weekly_budget_limit" ALTER COLUMN "amount" TYPE numeric(12, 2) USING round("amount"::double precision::numeric, 2);
--> statement-breakpoint
ALTER TABLE "shared_budget_weekly_limit" ALTER COLUMN "amount" TYPE numeric(12, 2) USING round("amount"::double precision::numeric, 2);
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "weeklyLimit" SET DEFAULT 10000;
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "salary" SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_amount_check" CHECK (("amount" > 0 OR ("operationType" = 'pocket_transfer' AND "amount" = 0)) AND "amount" <= 100000000) NOT VALID;
--> statement-breakpoint
ALTER TABLE "pocket_month_budget" ADD CONSTRAINT "pocket_month_budget_amount_max_check" CHECK ("budget" <= 100000000) NOT VALID;
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_budget_check" CHECK ("budget" > 0 AND "budget" <= 100000000) NOT VALID;
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_salary_check" CHECK ("salary" >= 0 AND "salary" <= 100000000) NOT VALID;
--> statement-breakpoint
ALTER TABLE "weekly_budget_limit" ADD CONSTRAINT "weekly_budget_limit_amount_check" CHECK ("amount" > 0 AND "amount" <= 100000000) NOT VALID;
--> statement-breakpoint
ALTER TABLE "shared_budget_weekly_limit" ADD CONSTRAINT "shared_budget_weekly_limit_amount_check" CHECK ("amount" > 0 AND "amount" <= 100000000) NOT VALID;
