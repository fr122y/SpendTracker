CREATE TABLE "shared_budget" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"createdByUserId" text NOT NULL,
	"archivedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_budget_member" (
	"sharedBudgetId" text NOT NULL,
	"userId" text NOT NULL,
	"role" text NOT NULL,
	"isActive" boolean DEFAULT false NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shared_budget_member_sharedBudgetId_userId_pk" PRIMARY KEY("sharedBudgetId","userId")
);
--> statement-breakpoint
CREATE TABLE "shared_budget_weekly_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"sharedBudgetId" text NOT NULL,
	"effectiveWeekStart" text NOT NULL,
	"amount" real NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shared_budget_weekly_limit_sharedBudgetId_effectiveWeekStart_unique" UNIQUE("sharedBudgetId","effectiveWeekStart")
);
--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "sharedBudgetId" text;
--> statement-breakpoint
ALTER TABLE "shared_budget" ADD CONSTRAINT "shared_budget_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shared_budget_member" ADD CONSTRAINT "shared_budget_member_sharedBudgetId_shared_budget_id_fk" FOREIGN KEY ("sharedBudgetId") REFERENCES "public"."shared_budget"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shared_budget_member" ADD CONSTRAINT "shared_budget_member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shared_budget_weekly_limit" ADD CONSTRAINT "shared_budget_weekly_limit_sharedBudgetId_shared_budget_id_fk" FOREIGN KEY ("sharedBudgetId") REFERENCES "public"."shared_budget"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_sharedBudgetId_shared_budget_id_fk" FOREIGN KEY ("sharedBudgetId") REFERENCES "public"."shared_budget"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "shared_budget_member_user_idx" ON "shared_budget_member" ("userId");
--> statement-breakpoint
CREATE UNIQUE INDEX "shared_budget_member_one_active_per_user_idx" ON "shared_budget_member" ("userId") WHERE "isActive" = true;
