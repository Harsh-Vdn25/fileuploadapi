-- AlterTable
ALTER TABLE "File" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mimeTypw" TEXT;

-- CreateTable
CREATE TABLE "pendingDelete" (
    "id" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pendingDelete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pendingDelete_s3Key_key" ON "pendingDelete"("s3Key");
