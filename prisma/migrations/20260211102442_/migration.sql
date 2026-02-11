/*
  Warnings:

  - You are about to drop the column `generatedname` on the `File` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "File_generatedname_key";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "generatedname";
