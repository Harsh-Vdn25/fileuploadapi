import { Request, Response } from "express";
import { prisma } from "../config/prismaClient";
import { findUserFile } from "../helpers/fileHelper";
import {
  deleteAllService,
  updateService,
  uploadService,
} from "../services/file.service";
import { storage } from "../storage/S3Storage";

export const uploadFile = async (req: Request, res: Response) => {
  const file = req.file;
  const userId = (req as any).userId;
  const isPrivate = req.body;
  if (!file || typeof isPrivate === 'boolean') return res.status(400).json({ message: "Send all the required information." });

  try {
    const result = await uploadService(file, userId,isPrivate);
    if (result === "INCOMPLETE_DETAILS") {
      return res
        .status(400)
        .json({ message: "please fill the details properly." });
    }

    if (result === "DUPLICATE_FILE") {
      return res.status(400).json({ message: "Duplicate file." });
    }

    res.status(200).json({ message: "Saved the file sucessfully" });
  } catch (err: any) {
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

    const s3Key = saved.savedFile?.latest?.s3Key;
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
  try {
    const saved = await findUserFile(userId, filename);
    if (!saved.success) {
      return res.status(404).json({ message: "File does not exist." });
    }

    const versionNo = saved.savedFile?.latest?.version! + 1;
    const result = await updateService(file, saved.savedFile?.id!, versionNo);

    if (result === "INCOMPLETE_DETAILS") {
      return res
        .status(400)
        .json({ message: "please fill the details properly." });
    }

    res.status(200).json({ message: "File updated." });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

//Hard delete
export const deleteFile = async (req: Request, res: Response) => {
  const filename = req.params.filename;
  if (!filename || typeof filename !== "string")
    return res.status(400).json({ message: "File not found" });
  const userId = (req as any).userId;

  try {
    const result = await deleteAllService(userId, filename);
    if (result === "NO_FILE") {
      return res.status(400).json({ message: "File doesn't exist." });
    }

    res.status(200).json({ message: "File deleted." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
