/*
  Warnings:

  - You are about to drop the column `provider` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `about` on the `Workspace` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Failed', 'Delivered', 'Seen');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'Failed';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "provider",
DROP COLUMN "refreshToken";

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "about";

-- DropEnum
DROP TYPE "Provider";
