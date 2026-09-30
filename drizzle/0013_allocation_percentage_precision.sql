ALTER TABLE "allocation_bucket"
ALTER COLUMN "percentage" TYPE double precision
USING "percentage"::double precision;
