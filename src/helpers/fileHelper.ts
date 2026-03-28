import { randomUUID } from "crypto";
import { prisma } from "../config/prismaClient";

export const findUserFile = async (userId: number, originalname: string) => {
  const savedFile = await prisma.file.findUnique({
    where: {
      originalname_ownerid: {
        originalname: originalname,
        ownerid: userId,
      },
    },
    include: {
      latest: true
    },
  });
  if (!savedFile) return { success: false };

  return { success: true, savedFile };
};

export const findUserFileByHash = async (ownerId: number, hash: string) => {
  const file = await prisma.file.findFirst({
    where: { ownerid: ownerId, latestHash: hash },
  });
  return { success: !!file, savedFile: file };
};

export const randomID = (file: string, version: number) => {
  return `${randomUUID()}-${file}/${version}`;
};