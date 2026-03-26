/*
  Warnings:

  - You are about to drop the column `mimeTypw` on the `File` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "mimeTypw",
ADD COLUMN     "mimeType" TEXT;
