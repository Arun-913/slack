/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Url` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Url_token_key" ON "Url"("token");
