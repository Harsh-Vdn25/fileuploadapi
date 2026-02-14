import { prisma } from "../config/prismaClient";
import { storage } from "../storage/S3Storage";

const deletePendingS3 = async () => {
  const deleteFiles = await prisma.pendingDelete.findMany({ take: 50 });
  for (let x of deleteFiles) {
    try {
      await storage.delete(x.s3Key);
      await prisma.pendingDelete.delete({
        where: { id: x.id },
      });
    } catch (err) {
      await prisma.pendingDelete.update({
        where: { id: x.id },
        data: { attempts: { increment: 1 } },
      });
    }
  }
};

export const startTimer = () => {
  const run =async()=>{
    await deletePendingS3();
    setTimeout(run,15*1000);
  }
  run();
};
