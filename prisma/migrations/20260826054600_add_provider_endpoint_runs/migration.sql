-- Append-only endpoint observations emitted by provider refreshes.
CREATE TABLE "provider_endpoint_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scrapeRunId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "endpointKey" TEXT NOT NULL,
    "endpointUrl" TEXT NOT NULL,
    "observedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "attemptCount" INTEGER NOT NULL,
    "statusCode" INTEGER,
    "retryAfterMs" INTEGER,
    "errorMessage" TEXT
);

CREATE INDEX "provider_endpoint_runs_scrapeRunId_idx"
    ON "provider_endpoint_runs"("scrapeRunId");

CREATE INDEX "provider_endpoint_runs_providerKey_observedAt_idx"
    ON "provider_endpoint_runs"("providerKey", "observedAt");

CREATE INDEX "provider_endpoint_runs_providerKey_endpointKey_observedAt_idx"
    ON "provider_endpoint_runs"("providerKey", "endpointKey", "observedAt");

CREATE INDEX "provider_endpoint_runs_observedAt_idx"
    ON "provider_endpoint_runs"("observedAt");
