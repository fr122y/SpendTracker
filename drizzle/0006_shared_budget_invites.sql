CREATE TABLE "shared_budget_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"sharedBudgetId" text NOT NULL,
	"createdByUserId" text NOT NULL,
	"tokenHash" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"acceptedAt" timestamp,
	"acceptedByUserId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shared_budget_invite_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
ALTER TABLE "shared_budget_invite" ADD CONSTRAINT "shared_budget_invite_sharedBudgetId_shared_budget_id_fk" FOREIGN KEY ("sharedBudgetId") REFERENCES "public"."shared_budget"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shared_budget_invite" ADD CONSTRAINT "shared_budget_invite_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shared_budget_invite" ADD CONSTRAINT "shared_budget_invite_acceptedByUserId_user_id_fk" FOREIGN KEY ("acceptedByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "shared_budget_invite_budget_idx" ON "shared_budget_invite" ("sharedBudgetId");
--> statement-breakpoint
CREATE INDEX "shared_budget_invite_expires_idx" ON "shared_budget_invite" ("expiresAt");
