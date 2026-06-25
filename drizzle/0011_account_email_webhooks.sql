CREATE TABLE "account_email_event" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"providerEventId" text NOT NULL,
	"type" text NOT NULL,
	"providerMessageId" text NOT NULL,
	"recipientEmail" text NOT NULL,
	"accountEmailMessageId" text,
	"payloadJson" jsonb NOT NULL,
	"reason" text,
	"createdAt" timestamp NOT NULL,
	"receivedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_email_event_providerEventId_unique" UNIQUE("providerEventId")
);
--> statement-breakpoint
CREATE TABLE "account_email_suppression" (
	"email" text PRIMARY KEY NOT NULL,
	"reason" text NOT NULL,
	"source" text NOT NULL,
	"providerMessageId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_email_event" ADD CONSTRAINT "account_email_event_accountEmailMessageId_account_email_message_id_fk" FOREIGN KEY ("accountEmailMessageId") REFERENCES "public"."account_email_message"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "account_email_event_message_idx" ON "account_email_event" ("accountEmailMessageId");
--> statement-breakpoint
CREATE INDEX "account_email_event_provider_message_idx" ON "account_email_event" ("providerMessageId");
--> statement-breakpoint
CREATE INDEX "account_email_event_recipient_idx" ON "account_email_event" ("recipientEmail");
--> statement-breakpoint
CREATE INDEX "account_email_event_type_idx" ON "account_email_event" ("type");
--> statement-breakpoint
CREATE INDEX "account_email_suppression_reason_idx" ON "account_email_suppression" ("reason");
--> statement-breakpoint
CREATE INDEX "account_email_suppression_provider_message_idx" ON "account_email_suppression" ("providerMessageId");
