CREATE TABLE "shared_budget_category" (
	"id" text PRIMARY KEY NOT NULL,
	"sharedBudgetId" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"archivedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "sharedBudgetCategoryId" text;
--> statement-breakpoint
ALTER TABLE "shared_budget_category" ADD CONSTRAINT "shared_budget_category_sharedBudgetId_shared_budget_id_fk" FOREIGN KEY ("sharedBudgetId") REFERENCES "public"."shared_budget"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_sharedBudgetCategoryId_shared_budget_category_id_fk" FOREIGN KEY ("sharedBudgetCategoryId") REFERENCES "public"."shared_budget_category"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "shared_budget_category_budget_idx" ON "shared_budget_category" ("sharedBudgetId");
--> statement-breakpoint
CREATE UNIQUE INDEX "shared_budget_category_active_name_idx" ON "shared_budget_category" ("sharedBudgetId","name") WHERE "archivedAt" is null;
--> statement-breakpoint
INSERT INTO "shared_budget_category" ("id", "sharedBudgetId", "name", "emoji")
SELECT
	md5("shared_budget"."id" || ':' || "category"."id"),
	"shared_budget"."id",
	"category"."name",
	"category"."emoji"
FROM "shared_budget"
INNER JOIN "category"
	ON "category"."userId" = "shared_budget"."createdByUserId"
ON CONFLICT DO NOTHING;
