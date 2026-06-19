CREATE TABLE "shared_budget_keyword_mapping" (
	"id" text PRIMARY KEY NOT NULL,
	"sharedBudgetId" text NOT NULL,
	"keyword" text NOT NULL,
	"sharedBudgetCategoryId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shared_budget_keyword_mapping_sharedBudgetId_keyword_unique" UNIQUE("sharedBudgetId","keyword")
);
--> statement-breakpoint
ALTER TABLE "shared_budget_keyword_mapping" ADD CONSTRAINT "shared_budget_keyword_mapping_sharedBudgetId_shared_budget_id_fk" FOREIGN KEY ("sharedBudgetId") REFERENCES "public"."shared_budget"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shared_budget_keyword_mapping" ADD CONSTRAINT "shared_budget_keyword_mapping_sharedBudgetCategoryId_shared_budget_category_id_fk" FOREIGN KEY ("sharedBudgetCategoryId") REFERENCES "public"."shared_budget_category"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "shared_budget_keyword_mapping_budget_idx" ON "shared_budget_keyword_mapping" ("sharedBudgetId");
