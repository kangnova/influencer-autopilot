-- CreateEnum
CREATE TYPE "PostFormat" AS ENUM ('VIDEO', 'CAROUSEL');

-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "cta" TEXT,
ADD COLUMN     "slides" JSONB;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "carouselImages" JSONB,
ADD COLUMN     "format" "PostFormat" NOT NULL DEFAULT 'VIDEO';
