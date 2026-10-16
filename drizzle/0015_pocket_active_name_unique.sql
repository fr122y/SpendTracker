-- IF NOT EXISTS keeps a rerun safe: the runner is not atomic, so the index can commit before its ledger row is recorded.
CREATE UNIQUE INDEX IF NOT EXISTS "pocket_active_name_unique_idx" ON "pocket" USING btree ("userId", lower(btrim("name"))) WHERE "archivedAt" IS NULL;
