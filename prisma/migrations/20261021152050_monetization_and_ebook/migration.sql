-- CreateEnum
CREATE TYPE "MonetizationType" AS ENUM ('OWN_PRODUCT', 'AFFILIATE');

-- AlterEnum
ALTER TYPE "JobType" ADD VALUE 'EBOOK_GENERATE';

-- AlterTable
ALTER TABLE "Niche" ADD COLUMN     "monetizationType" "MonetizationType" NOT NULL DEFAULT 'OWN_PRODUCT';

-- CreateTable
CREATE TABLE "Ebook" (
    "id" TEXT NOT NULL,
    "nicheId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "chapters" JSONB NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ebook_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ebook" ADD CONSTRAINT "Ebook_nicheId_fkey" FOREIGN KEY ("nicheId") REFERENCES "Niche"("id") ON DELETE CASCADE ON UPDATE CASCADE;
