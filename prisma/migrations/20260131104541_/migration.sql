/*
  Warnings:

  - A unique constraint covering the columns `[originalname,ownerid]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_originalname_ownerid_key" ON "File"("originalname", "ownerid");
