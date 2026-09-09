-- Supports the active Career Engine feed query:
-- WHERE isExpired = false ORDER BY postedAt DESC, createdAt DESC.
CREATE INDEX "job_postings_isExpired_postedAt_createdAt_idx"
ON "job_postings"("isExpired", "postedAt" DESC, "createdAt" DESC);
