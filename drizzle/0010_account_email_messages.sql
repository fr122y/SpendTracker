CREATE TABLE "account_email_message" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"recipientEmail" text NOT NULL,
	"userId" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text,
	"providerMessageId" text,
	"idempotencyKey" text NOT NULL,
	"subject" text NOT NULL,
	"text" text NOT NULL,
	"html" text NOT NULL,
	"replyTo" text,
	"attemptsCount" integer DEFAULT 0 NOT NULL,
	"lastError" text,
	"nextRetryAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"sentAt" timestamp,
	CONSTRAINT "account_email_message_idempotencyKey_unique" UNIQUE("idempotencyKey")
);
--> statement-breakpoint
ALTER TABLE "account_email_message" ADD CONSTRAINT "account_email_message_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "account_email_message_status_retry_idx" ON "account_email_message" ("status","nextRetryAt");
--> statement-breakpoint
CREATE INDEX "account_email_message_user_idx" ON "account_email_message" ("userId");
