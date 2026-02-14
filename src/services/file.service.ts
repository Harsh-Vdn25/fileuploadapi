import { randomUUID } from "crypto";
import { prisma } from "../config/prismaClient";
import { S3Storage } from "../storage/S3Storage";
import { isPrismaUniqueError } from "../helpers/prismaError";

const randomID = (file: string, version: number) => {
  return `${randomUUID()}-${file}/${version}`;
};
export const storage = new S3Storage();

export const uploadService = async (
  file: Express.Multer.File,
  userId: number,
):Promise<"INCOMPLETE_DETAILS"|"DUPLICATE_FILE"|"SUCCESS"> => {
  if (!userId || typeof userId !== "number" || !file) {
    return "INCOMPLETE_DETAILS";
  }
  var uploaded = false;
  const generatedname = randomID(file.originalname, 1);
  try {
    await storage.save(file, generatedname);
    uploaded = true;
    await prisma.$transaction(async (tx) => {
      const fileV1 = await tx.file.create({
        data: {
          originalname: file.originalname,
          ownerid: userId,
          versions: {
            create: {
              version: 1,
              s3Key: generatedname,
            },
          },
        },
        include: {
          versions: true,
        },
      });
      await tx.file.update({
        where: {
          id: fileV1.id,
        },
        data: {
          latestId: fileV1.versions[0]?.id!,
        },
      });
    });
    return "SUCCESS";
  } catch (err: any) {
    if (uploaded) {
      await storage.delete(generatedname);
    }
    if (isPrismaUniqueError(err)) {
        return "DUPLICATE_FILE";
    }
    throw err;
  }
};
export const updateService = async (
  file: Express.Multer.File,
  fileId: string,
  version: number,
):Promise<"INCOMPLETE_DETAILS"|"SUCCESS"> => {
  if (!fileId || typeof fileId !== "string" || !file) {
    return "INCOMPLETE_DETAILS";
  }
  const generatedname = randomID(file.originalname, version);
  var uploaded = false;
  try {
    await storage.save(file, generatedname);
    uploaded = true;
    //To ensure atomicity
    await prisma.$transaction(async (tx) => {
      const update = await tx.fileVersion.create({
        data: {
          fileId: fileId,
          version: version,
          s3Key: generatedname,
        },
      });
      await tx.file.update({
        where:{
            id: update.fileId
        },data:{
            latestId: update.id
        }
      });
    });
    return "SUCCESS";
  } catch (err) {
    if(uploaded){
        await storage.delete(generatedname);
    }
    throw err;
  }
};
