-- Server-side session revocation for JWT sessions (T-064). "sessionVersion" invalidates every token issued before a password change; "revoked_session" lists token ids ended by sign-out until the token would expire anyway. The runner applies the file and its ledger row in one implicit transaction; every statement is still safe to rerun by hand (IF NOT EXISTS, DROP CONSTRAINT IF EXISTS).
-- ADD COLUMN with a constant default is metadata-only in PostgreSQL 11+: existing users read as version 0 without a table rewrite.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "sessionVersion" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revoked_session" (
	"sid" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "revoked_session" DROP CONSTRAINT IF EXISTS "revoked_session_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "revoked_session" ADD CONSTRAINT "revoked_session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revoked_session_expires_idx" ON "revoked_session" ("expiresAt");
