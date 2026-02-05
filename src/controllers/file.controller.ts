import { Request, Response } from "express";
import fs from "node:fs/promises";
import { prisma } from "../config/prismaClient";
import path from "node:path";
import { Credentials } from "../config/creds";
import { findUserFile } from "../helpers/fileHelper";
import { isPrismaUniqueError } from "../helpers/prismaError";

export const uploadFile = async (req: Request, res: Response) => {
  const file = req.file;
  const userId = (req as any).userId;
  if (!file) return res.status(400).json({ message: "No file sent." });
  try {
    await prisma.file.create({
      data: {
        generatedname: file.filename,
        originalname: file.originalname,
        ownerid: userId,
      },
    });
    res.status(200).json({ message: "Saved the file sucessfully" });
  } catch (err) {
    if (isPrismaUniqueError(err)) {
      await fs.unlink(path.join(Credentials.DIR_ADDR!, file.filename));
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
    await fs.unlink(path.join(Credentials.DIR_ADDR!, file.filename));
    res.status(500).json({ message: "" });
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

    await prisma.file.delete({
      where: {
        generatedname: saved.savedFile!.generatedname,
      },
    });
    await fs.unlink(saved.filePath!);
    res.status(200).json({ message: "File deleted." });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
