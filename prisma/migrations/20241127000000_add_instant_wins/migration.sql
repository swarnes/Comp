-- CreateEnum
CREATE TYPE "InstantPrizeType" AS ENUM ('CASH', 'RYDER_CASH');

-- CreateEnum
CREATE TYPE "InstantResult" AS ENUM ('NONE', 'WIN');

-- AlterTable: Add cashBalance to User
ALTER TABLE "User" ADD COLUMN "cashBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable: Add hasInstantWins to Competition
ALTER TABLE "Competition" ADD COLUMN "hasInstantWins" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add instant win fields to Entry
ALTER TABLE "Entry" ADD COLUMN "instantWinResults" TEXT;
ALTER TABLE "Entry" ADD COLUMN "hasInstantWin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: InstantPrize
CREATE TABLE "InstantPrize" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prizeType" "InstantPrizeType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "totalWins" INTEGER NOT NULL,
    "remainingWins" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstantPrize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstantPrize_competitionId_idx" ON "InstantPrize"("competitionId");

-- AddForeignKey
ALTER TABLE "InstantPrize" ADD CONSTRAINT "InstantPrize_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

