CREATE TABLE "keyword_mapping" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"keyword" text NOT NULL,
	"categoryId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "keyword_mapping_userId_keyword_unique" UNIQUE("userId","keyword")
);
--> statement-breakpoint
ALTER TABLE "keyword_mapping" ADD CONSTRAINT "keyword_mapping_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_mapping" ADD CONSTRAINT "keyword_mapping_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;