import { Request, Response } from "express";
import fs from "node:fs/promises";
import { prisma } from "../config/prismaClient";
import path from "node:path";
import { Credentials } from "../config/creds";
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
  const generatedname = randomID(file.filename);
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
      await storage.delete(generatedname);
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

    res.download(saved.filePath!);
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
  try {
    const saved = await findUserFile(userId, filename);

    if (!saved.success) {
      return res.status(404).json({ message: "File does not exist." });
    }
    
    await prisma.file.update({
      where: {
        originalname_ownerid: {
          originalname: filename,
          ownerid: userId,
        },
      },
      data: {
        generatedname: file?.filename,
      },
    });

    await fs.unlink(saved.filePath!);

    res.status(200).json({ message: "File updated." });
  } catch (err) {
    return res.status(409).json({ message: "Duplicate file name" });
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
