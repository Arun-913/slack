-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Invite" (
    "token" TEXT NOT NULL,
    "multipleUsage" BOOLEAN NOT NULL,
    "isUsed" BOOLEAN
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");
