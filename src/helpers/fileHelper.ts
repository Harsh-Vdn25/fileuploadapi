import { Credentials } from "../config/creds";
import { prisma } from "../config/prismaClient";
import path from "path";

export const findUserFile = async (userId: number, filename: string) => {
  const savedFile = await prisma.file.findUnique({
    where: {
      originalname_ownerid: {
        originalname: filename,
        ownerid: userId,
      },
    },
  });
  if (!savedFile) return null;

  const filePath = path.join(Credentials.DIR_ADDR!, savedFile.generatedname);
  return {savedFile,filePath};
};
