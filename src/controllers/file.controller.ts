import { Request, Response } from "express";
import { prisma } from "../config/prismaClient";
import { findUserFile } from "../helpers/fileHelper";
import { isPrismaUniqueError } from "../helpers/prismaError";
import { randomUUID } from "node:crypto";
import { S3Storage } from "../storage/S3Storage";

const randomID = (file: string, version: number) => {
  return `${randomUUID()}-${file}/${version}`;
};
const storage = new S3Storage();

export const uploadFile = async (req: Request, res: Response) => {
  const file = req.file;
  const userId = (req as any).userId;
  if (!file) return res.status(400).json({ message: "No file sent." });
  const generatedname = randomID(file.originalname, 1);
  var uploaded = false;
  try {
    await storage.save(file, generatedname);
    uploaded = true;
    await prisma.$transaction(async(tx) => {
      const fileV1 = await tx.file.create({
        //if this fails we can delete the S3 file
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
        include: { versions: true },
      });

      //update the latestId so that latest version can be retrieved
      await tx.file.update({
        where: { id: fileV1.id },
        data: { latestId: fileV1.versions[0]?.id! },
      });
    });

    res.status(200).json({ message: "Saved the file sucessfully" });
  } catch (err) {
    if (uploaded) {
      //having it here deletes the file even if the prismaunique const fails
      await storage.delete(generatedname);
    }
    if (isPrismaUniqueError(err)) {
      return res.status(409).json({ message: "Duplicate file." });
    }

    return res.status(500).json({
      error: err,
      message: "Something went wrong.",
    });
  }
};

export const getFile = async (req: Request, res: Response) => {
  const filename = req.params.filename;
  const userId = (req as any).userId;
  if (!filename || typeof filename !== "string") {
    return res.status(404).json({ message: "File not found" });
  }
  try {
    const saved = await findUserFile(userId, filename);

    if (!saved.success)
      return res
        .status(404)
        .json({ message: "File with the given name doesnot exist" });

    const s3Key = saved.savedFile?.versions[0]?.s3Key;
    const stream = await storage.get(s3Key!);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${saved.savedFile?.originalname}"`,
    );
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: "Serverside error" });
  }
};

export const updateFile = async (req: Request, res: Response) => {
  const file = req.file;
  const filename = req.params.filename;
  if (!file) return res.status(400).json({ message: "Please send the file" });
  if (!filename || typeof filename !== "string")
    return res.status(400).json({ message: "File not found" });
  const userId = (req as any).userId;
  var generatedname = "";
  var uploaded = false;
  try {
    const saved = await findUserFile(userId, filename);
    if (!saved.success) {
      return res.status(404).json({ message: "File does not exist." });
    }
    const versionNo = saved.savedFile?.versions[0]?.version! + 1;
    generatedname = randomID(file.originalname, versionNo);
    await storage.save(file, generatedname);
    uploaded = true;
    //To ensure atomicity
    await prisma.$transaction(async (tx) => {
      const newVersion = await tx.fileVersion.create({
        data: {
          fileId: saved.savedFile?.id!,
          version: versionNo,
          s3Key: generatedname,
        },
      });
      await tx.file.update({
        where: {
          id: newVersion.fileId,
        },
        data: {
          latestId: newVersion.id,
        },
      });
    });
    res.status(200).json({ message: "File updated." });
  } catch (err) {
    if (uploaded) {
      await storage.delete(generatedname);
    }
    return res.status(409).json({ message: "Internal server error" });
  }
};

//Hard delete
export const deleteFile = async (req: Request, res: Response) => {
  const filename = req.params.filename;
  if (!filename || typeof filename !== "string")
    return res.status(400).json({ message: "File not found" });
  const userId = (req as any).userId;

  try {
    const saved = await findUserFile(userId, filename);
    if (!saved.success)
      return res.status(404).json({ message: "File doesn't exist." });

    await storage.delete(saved.savedFile?.versions[0]?.s3Key!);
    
    await prisma.file.delete({
      where: {
        originalname_ownerid: {
          ownerid: userId,
          originalname: saved.savedFile?.originalname!,
        },
      },
    });
    res.status(200).json({ message: "File deleted." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
