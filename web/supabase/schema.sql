-- CrownFi fresh Supabase schema
-- Generated from prisma/schema.prisma for a NEW project. Run once in Supabase SQL Editor.
-- Supabase stores app data; Privy authenticates web2 users; Base Sepolia is the EVM test network.

BEGIN;
SET search_path TO public;

-- CreateTable
CREATE TABLE "Fan" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "email" TEXT,
    "walletAddress" TEXT,
    "privyUserId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "registrationIpHash" TEXT,
    "kycStatus" TEXT NOT NULL DEFAULT 'none',
    "authProvider" TEXT NOT NULL DEFAULT 'base',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "fanId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialTask" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "actionUrl" TEXT,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCompletion" (
    "id" TEXT NOT NULL,
    "fanId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "stock" INTEGER,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "fanId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'fulfilled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contestant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "sash" TEXT NOT NULL,
    "portraitUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contestant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VotingRound" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "VotingRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "fanId" TEXT NOT NULL,
    "contestantId" TEXT NOT NULL,
    "leafHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkpoint" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "tallyHash" TEXT NOT NULL,
    "totalVotes" INTEGER NOT NULL,
    "anchorTx" TEXT,
    "tallyJson" TEXT NOT NULL,
    "leavesJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "fanId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "seat" TEXT NOT NULL,
    "priceUsdc" DOUBLE PRECISION NOT NULL,
    "tokenId" TEXT,
    "mintTx" TEXT,
    "status" TEXT NOT NULL DEFAULT 'minted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collectible" (
    "id" TEXT NOT NULL,
    "contestantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metadataUri" TEXT NOT NULL,
    "imageUrl" TEXT,
    "priceUsdc" DOUBLE PRECISION NOT NULL,
    "edition" INTEGER NOT NULL,
    "candidateId" INTEGER,
    "listingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collectible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "fanId" TEXT NOT NULL,
    "collectibleId" TEXT NOT NULL,
    "priceUsdc" DOUBLE PRECISION NOT NULL,
    "tokenId" TEXT,
    "mintTx" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerRequest" (
    "id" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pageantName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pageant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerFanId" TEXT,
    "orgName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "socials" TEXT,
    "verification" TEXT,
    "driveUrl" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3),
    "venue" TEXT,
    "bannerUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewNote" TEXT,
    "nftContractId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pageant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageantCategory" (
    "id" TEXT NOT NULL,
    "pageantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "PageantCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "pageantId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "number" INTEGER,
    "bio" TEXT,
    "age" INTEGER,
    "location" TEXT,
    "profileUrl" TEXT,
    "nftArtworkUrl" TEXT,
    "maxSupply" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateImage" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "CandidateImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keepalive" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "last_ping" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keepalive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "paymentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "kycEnabled" BOOLEAN NOT NULL DEFAULT false,
    "kycMandatory" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT NOT NULL DEFAULT 'testnet',
    "activeProvider" TEXT NOT NULL DEFAULT 'testnet_usdc',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "winnersAnnounced" BOOLEAN NOT NULL DEFAULT false,
    "providerConfig" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "fanId" TEXT,
    "kind" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycLog" (
    "id" TEXT NOT NULL,
    "fanId" TEXT,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredImage" (
    "id" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionMarket" (
    "id" TEXT NOT NULL,
    "pageantId" TEXT,
    "creatorFanId" TEXT,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionsJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closeTime" TIMESTAMP(3) NOT NULL,
    "winningOption" INTEGER,
    "bannerUrl" TEXT,
    "chainMarketId" INTEGER,
    "createTxHash" TEXT,
    "resolveTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "fanId" TEXT NOT NULL,
    "option" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "txHash" TEXT,
    "claimTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fan_handle_key" ON "Fan"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Fan_email_key" ON "Fan"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fan_walletAddress_key" ON "Fan"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Fan_privyUserId_key" ON "Fan"("privyUserId");

-- CreateIndex
CREATE INDEX "Fan_registrationIpHash_idx" ON "Fan"("registrationIpHash");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_fanId_idx" ON "LoyaltyTransaction"("fanId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialTask_key_key" ON "SocialTask"("key");

-- CreateIndex
CREATE INDEX "TaskCompletion_fanId_idx" ON "TaskCompletion"("fanId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCompletion_fanId_taskId_key" ON "TaskCompletion"("fanId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_key_key" ON "Reward"("key");

-- CreateIndex
CREATE INDEX "Redemption_fanId_idx" ON "Redemption"("fanId");

-- CreateIndex
CREATE UNIQUE INDEX "Contestant_sash_key" ON "Contestant"("sash");

-- CreateIndex
CREATE INDEX "Vote_roundId_idx" ON "Vote"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_roundId_fanId_key" ON "Vote"("roundId", "fanId");

-- CreateIndex
CREATE UNIQUE INDEX "Checkpoint_roundId_key" ON "Checkpoint"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "Collectible_listingId_key" ON "Collectible"("listingId");

-- CreateIndex
CREATE INDEX "Purchase_fanId_idx" ON "Purchase"("fanId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_fanId_collectibleId_key" ON "Purchase"("fanId", "collectibleId");

-- CreateIndex
CREATE UNIQUE INDEX "Pageant_slug_key" ON "Pageant"("slug");

-- CreateIndex
CREATE INDEX "Pageant_status_idx" ON "Pageant"("status");

-- CreateIndex
CREATE INDEX "Pageant_ownerFanId_idx" ON "Pageant"("ownerFanId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_key_key" ON "Category"("key");

-- CreateIndex
CREATE INDEX "PageantCategory_pageantId_idx" ON "PageantCategory"("pageantId");

-- CreateIndex
CREATE UNIQUE INDEX "PageantCategory_pageantId_categoryId_key" ON "PageantCategory"("pageantId", "categoryId");

-- CreateIndex
CREATE INDEX "Candidate_pageantId_idx" ON "Candidate"("pageantId");

-- CreateIndex
CREATE INDEX "CandidateImage_candidateId_idx" ON "CandidateImage"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateImage_candidateId_categoryKey_key" ON "CandidateImage"("candidateId", "categoryKey");

-- CreateIndex
CREATE INDEX "PaymentLog_createdAt_idx" ON "PaymentLog"("createdAt");

-- CreateIndex
CREATE INDEX "KycLog_createdAt_idx" ON "KycLog"("createdAt");

-- CreateIndex
CREATE INDEX "PredictionMarket_status_idx" ON "PredictionMarket"("status");

-- CreateIndex
CREATE INDEX "PredictionMarket_category_idx" ON "PredictionMarket"("category");

-- CreateIndex
CREATE INDEX "PredictionMarket_creatorFanId_idx" ON "PredictionMarket"("creatorFanId");

-- CreateIndex
CREATE INDEX "Prediction_marketId_idx" ON "Prediction"("marketId");

-- CreateIndex
CREATE INDEX "Prediction_fanId_idx" ON "Prediction"("fanId");

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SocialTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "VotingRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "Contestant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkpoint" ADD CONSTRAINT "Checkpoint_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "VotingRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collectible" ADD CONSTRAINT "Collectible_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "Contestant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pageant" ADD CONSTRAINT "Pageant_ownerFanId_fkey" FOREIGN KEY ("ownerFanId") REFERENCES "Fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageantCategory" ADD CONSTRAINT "PageantCategory_pageantId_fkey" FOREIGN KEY ("pageantId") REFERENCES "Pageant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageantCategory" ADD CONSTRAINT "PageantCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_pageantId_fkey" FOREIGN KEY ("pageantId") REFERENCES "Pageant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateImage" ADD CONSTRAINT "CandidateImage_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycLog" ADD CONSTRAINT "KycLog_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionMarket" ADD CONSTRAINT "PredictionMarket_pageantId_fkey" FOREIGN KEY ("pageantId") REFERENCES "Pageant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionMarket" ADD CONSTRAINT "PredictionMarket_creatorFanId_fkey" FOREIGN KEY ("creatorFanId") REFERENCES "Fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "PredictionMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Fan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Supabase hardening: CrownFi accesses Postgres only from trusted Next.js server code.
-- Privy is the user identity provider, so no Supabase Auth policies are exposed here.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER TABLE public."Fan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LoyaltyTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SocialTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TaskCompletion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Reward" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Redemption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Contestant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VotingRound" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Vote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Checkpoint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Collectible" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Purchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OrganizerRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pageant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PageantCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Candidate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CandidateImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."keepalive" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PlatformSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PaymentLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."KycLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StoredImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PredictionMarket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Prediction" ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies are intentional. The Prisma database role remains server-only.
COMMIT;

