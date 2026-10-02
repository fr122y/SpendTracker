CREATE TABLE "pocket" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "name" text NOT NULL,
  "archivedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "pocket_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "pocket_month_budget" (
  "pocketId" text NOT NULL,
  "period" text NOT NULL,
  "budget" real NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "pocket_month_budget_pocketId_period_pk" PRIMARY KEY("pocketId", "period"),
  CONSTRAINT "pocket_month_budget_period_check" CHECK ("period" ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  CONSTRAINT "pocket_month_budget_amount_check" CHECK ("budget" >= 0),
  CONSTRAINT "pocket_month_budget_pocketId_pocket_id_fk" FOREIGN KEY ("pocketId") REFERENCES "public"."pocket"("id") ON DELETE restrict ON UPDATE no action
);
--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "pocketId" text;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_pocketId_pocket_id_fk" FOREIGN KEY ("pocketId") REFERENCES "public"."pocket"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_pocket_scope_check" CHECK ("pocketId" IS NULL OR ("projectId" IS NULL AND "sharedBudgetId" IS NULL AND "operationType" IN ('expense', 'pocket_transfer')));
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_pocket_transfer_link_check" CHECK ("operationType" <> 'pocket_transfer' OR "pocketId" IS NOT NULL);
--> statement-breakpoint
CREATE INDEX "pocket_user_idx" ON "pocket" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX "pocket_month_budget_period_idx" ON "pocket_month_budget" USING btree ("period");
