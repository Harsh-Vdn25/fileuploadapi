import { Request, Response } from "express";
import { prisma } from "../config/prismaClient";
import { findUserFile } from "../helpers/fileHelper";
import { isPrismaUniqueError } from "../helpers/prismaError";
import { randomUUID } from "node:crypto";
import { S3Storage } from "../storage/S3Storage";

const randomID = (file: string) => {
  return `${randomUUID()}-${file}`;
};
const storage = new S3Storage();

export const uploadFile = async (req: Request, res: Response) => {
  const file = req.file;
  const userId = (req as any).userId;
  if (!file) return res.status(400).json({ message: "No file sent." });
  const generatedname = randomID(file.originalname);
  try {
    await prisma.file.create({
      data: {
        generatedname: generatedname,
        originalname: file.originalname,
        ownerid: userId,
      },
    });
    await storage.save(file, generatedname);
    res.status(200).json({ message: "Saved the file sucessfully" });
  } catch (err) {
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

    const stream = await storage.get(saved.savedFile?.generatedname!);
    res.setHeader(
      "Content-Type",
      `filename = ${saved.savedFile?.originalname}`
    )
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
  const generatedname = randomID(file.filename);
  var uploaded = false;
  try {
    const saved = await findUserFile(userId, filename);

    if (!saved.success) {
      return res.status(404).json({ message: "File does not exist." });
    }

    await storage.save(file, generatedname);
    await prisma.file.update({
      where: {
        originalname_ownerid: {
          originalname: filename,
          ownerid: userId,
        },
      },
      data: {
        generatedname: generatedname,
      },
    });

    await storage.delete(saved.savedFile?.generatedname!);

    res.status(200).json({ message: "File updated." });
  } catch (err) {
    if (uploaded) {
      await storage.delete(generatedname);
    }
    return res.status(409).json({ message: "Internal server error" });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  const filename = req.params.filename;
  if (!filename || typeof filename !== "string")
    return res.status(400).json({ message: "File not found" });
  const userId = (req as any).userId;

  try {
    const saved = await findUserFile(userId, filename);
    if (!saved.success)
      return res.status(404).json({ message: "File doesn't exist." });

    await storage.delete(saved.savedFile?.generatedname!);
    await prisma.$transaction(async (tx) => {
      await tx.file.delete({
        where: {
          originalname_ownerid: {
            ownerid: userId,
            originalname: saved.savedFile?.originalname!,
          },
        },
      });
    });

    res.status(200).json({ message: "File deleted." });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
