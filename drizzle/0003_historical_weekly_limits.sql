CREATE TABLE "weekly_budget_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"effectiveWeekStart" text NOT NULL,
	"amount" real NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_budget_limit_userId_effectiveWeekStart_unique" UNIQUE("userId","effectiveWeekStart")
);
--> statement-breakpoint
ALTER TABLE "weekly_budget_limit" ADD CONSTRAINT "weekly_budget_limit_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "weekly_budget_limit" ("id", "userId", "effectiveWeekStart", "amount")
SELECT 'weekly-limit-baseline-' || "userId", "userId", '1970-01-05', "weeklyLimit"
FROM "user_settings"
ON CONFLICT ("userId", "effectiveWeekStart") DO NOTHING;
