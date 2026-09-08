-- Prevent the same on-chain market or transaction receipt from being indexed more
-- than once. PostgreSQL unique indexes allow multiple NULL values, so legacy
-- off-chain rows remain valid.
CREATE UNIQUE INDEX "PredictionMarket_chainMarketId_key"
ON "PredictionMarket"("chainMarketId");

CREATE UNIQUE INDEX "PredictionMarket_createTxHash_key"
ON "PredictionMarket"("createTxHash");

CREATE UNIQUE INDEX "Prediction_txHash_key"
ON "Prediction"("txHash");
