import { prisma } from "../config/prismaClient";

export const findUserFile = async (userId: number, filename: string) => {
  const savedFile = await prisma.file.findUnique({
    where: {
      originalname_ownerid: {
        originalname: filename,
        ownerid: userId,
      },
    },
    include: {
      versions: {
        orderBy: {
          version: "desc",
        },
        take: 1,
      },
    },
  });
  if (!savedFile) return { success: false };

  return { success: true, savedFile };
};
