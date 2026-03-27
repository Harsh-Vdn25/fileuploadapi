import { randomUUID } from "crypto";
import { prisma } from "../config/prismaClient";
import { storage } from "../storage/S3Storage";
import { getFileHash } from "../helpers/contentHash";
import { findUserFile } from "../helpers/fileHelper";

export const randomID = (file: string, version: number) => {
  return `${randomUUID()}-${file}/${version}`;
};
export const uploadService = async (
  file: Express.Multer.File,
  ownerId: number,
  isPrivate: boolean,
): Promise<
  { status: "DUPLICATE_FILE" } | { status: "SUCCESS"; fileToken?: string }
> => {
  var uploaded = false;
  const generatedname = randomID(file.originalname, 1);

  try {
    const fileHash = await getFileHash(file.path);
    const saved = await findUserFile(ownerId, file.originalname);
    if (saved.success && saved.savedFile?.latestHash === fileHash)
      return { status: "DUPLICATE_FILE" };

    const token = !isPrivate ? randomUUID() : undefined;
    await storage.save(file, generatedname);
    uploaded = true;
    
    await prisma.$transaction(async (tx) => {
      const fileV1 = await tx.file.create({
        data: {
          originalname: file.originalname,
          ownerid: ownerId,
          mimeType: file.mimetype,
          isPrivate: isPrivate,
          latestHash: fileHash,
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

      if (!isPrivate) {
        await tx.fileShare.create({
          data: {
            versionId: fileV1.versions[0]?.id!,
            token: token as string,
          },
        });
      }
    });

    return {
      status: "SUCCESS",
      ...(!isPrivate && { fileToken: token as string }),
    };
  } catch (err: any) {
    if (uploaded) {
      await storage.delete(generatedname);
    }
    throw err;
  }
};

export const updateService = async (
  file: Express.Multer.File,
  ownerId: number,
  originalname: string,
): Promise<
  | { status: "SUCCESS"; fileToken?: string }
  | { status: "DUPLICATE_FILE" }
  | { status: "FILE_NOT_FOUND" }
> => {
  const saved = await findUserFile(ownerId, originalname);

  if (!saved.success) {
    return { status: "FILE_NOT_FOUND" };
  }

  const version = saved.savedFile!.latest!.version + 1;
  const fileHash = await getFileHash(file.path);

  if (saved.savedFile!.latestHash === fileHash) {
    return { status: "DUPLICATE_FILE" };
  }

  const generatedname = randomID(file.originalname, version);
  const token = !saved.savedFile!.isPrivate ? randomUUID() : undefined;

  let uploaded = false;

  try {
    await storage.save(file, generatedname);
    uploaded = true;

    await prisma.$transaction(async (tx) => {
      const versionRow = await tx.fileVersion.create({
        data: {
          fileId: saved.savedFile!.id,
          version,
          s3Key: generatedname,
        },
      });

      await tx.file.update({
        where: { id: saved.savedFile!.id },
        data: {
          latestId: versionRow.id,
        },
      });

      if (!saved.savedFile!.isPrivate) {
        await tx.fileShare.create({
          data: {
            versionId: versionRow.id,
            token: token!,
          },
        });
      }
    });

    return {
      status: "SUCCESS",
      ...(!saved.savedFile!.isPrivate && { fileToken: token! }),
    };
  } catch (err) {
    if (uploaded) {
      await storage.delete(generatedname);
    }

    throw err;
  }
};

export const deleteAllService = async (
  ownerId: number,
  filename: string,
): Promise<"NO_FILE" | "SUCCESS"> => {
  try {
    const saved = await prisma.file.findUnique({//get all the versions and put them into the pendingDelete
      where: {
        originalname_ownerid: {
          originalname: filename,
          ownerid: ownerId,
        },
      },
      include: {
        versions: true,
      },
    });
    if (!saved?.id) return "NO_FILE";

    await prisma.$transaction(async (tx) => {
      await prisma.file.delete({
        where: {
          originalname_ownerid: {
            ownerid: ownerId,
            originalname: saved.originalname,
          },
        },
      });
      //Delete these files later
      const dataToDelete = saved.versions.map((x) => ({ s3Key: x.s3Key }));
      await prisma.pendingDelete.createMany({
        data: dataToDelete,
      });
    });
    return "SUCCESS";
  } catch (err) {
    throw err;
  }
};
