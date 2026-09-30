ALTER TABLE "allocation_bucket"
ADD COLUMN "basis" text DEFAULT 'percentage' NOT NULL;
--> statement-breakpoint
ALTER TABLE "allocation_bucket"
ADD COLUMN "amountKopecks" bigint;
--> statement-breakpoint
ALTER TABLE "allocation_bucket"
ADD CONSTRAINT "allocation_bucket_basis_check"
CHECK ("basis" in ('percentage', 'amount'));
--> statement-breakpoint
ALTER TABLE "allocation_bucket"
ADD CONSTRAINT "allocation_bucket_amount_kopecks_check"
CHECK (
  "amountKopecks" is null
  or ("amountKopecks" >= 0 and "amountKopecks" <= 9007199254740991)
);
--> statement-breakpoint
ALTER TABLE "allocation_bucket"
ADD CONSTRAINT "allocation_bucket_amount_basis_check"
CHECK ("basis" <> 'amount' or "amountKopecks" is not null);
