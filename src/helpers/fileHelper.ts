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
