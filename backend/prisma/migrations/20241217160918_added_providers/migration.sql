-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('Google', 'Basic');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" "Provider" NOT NULL DEFAULT 'Basic',
ADD COLUMN     "refreshToken" TEXT;
