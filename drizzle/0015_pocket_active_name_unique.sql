CREATE UNIQUE INDEX "pocket_active_name_unique_idx" ON "pocket" USING btree ("userId", lower(btrim("name"))) WHERE "archivedAt" IS NULL;
