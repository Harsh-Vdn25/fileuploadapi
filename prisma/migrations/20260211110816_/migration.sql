/*
  Warnings:

  - A unique constraint covering the columns `[latestId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[s3Key]` on the table `FileVersion` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "FileVersion" DROP CONSTRAINT "FileVersion_fileId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "File_latestId_key" ON "File"("latestId");

-- CreateIndex
CREATE UNIQUE INDEX "FileVersion_s3Key_key" ON "FileVersion"("s3Key");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_latestId_fkey" FOREIGN KEY ("latestId") REFERENCES "FileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVersion" ADD CONSTRAINT "FileVersion_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
