-- AlterTable
ALTER TABLE "File" ADD COLUMN     "latestHash" TEXT;

-- CreateTable
CREATE TABLE "FileShare" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "Link" TEXT NOT NULL,

    CONSTRAINT "FileShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileShare_versionId_key" ON "FileShare"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "FileShare_Link_key" ON "FileShare"("Link");

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "FileVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
