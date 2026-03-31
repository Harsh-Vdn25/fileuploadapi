import { Request, Response } from "express";
import { findUserFile } from "../helpers/fileHelper";
import {
  deleteAllService,
  updateService,
  uploadService,
} from "../services/file.service";
import { storage } from "../storage/S3Storage";
import { prisma } from "../config/prismaClient";

export const uploadFile = async (req: Request, res: Response) => {
  const file = req.file;
  const userId = (req as any).userId;
  const isPrivate = req.body.isPrivate === "true";

  if (!file)
    return res
      .status(400)
      .json({ message: "Send all the required information." });

  try {
    const uploadRes = await uploadService(file, userId, isPrivate);

    if (uploadRes.status === "DUPLICATE_FILE") {
      return res.status(409).json({ message: "Duplicate file." });
    }

    if (uploadRes.status === "FILE_EXISTS") {
      return res
        .status(409)
        .json({ message: "File with the same name exists." });
    }

    res.status(201).json({
      message: "Saved the file sucessfully",
      ...(uploadRes.fileToken && { fileToken: uploadRes.fileToken }),
    });
  } catch {
    return res.status(500).json({
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
  const originalname = req.params.originalname;
  if (!file) return res.status(400).json({ message: "Please send the file" });

  if (!originalname || typeof originalname !== "string")
    return res.status(400).json({ message: "File not found" });

  const userId = (req as any).userId;
  try {
    const updateRes = await updateService(file, userId, originalname);
    if (updateRes.status === "FILE_NOT_FOUND")
      return res.status(400).json({ message: "No file with the given name." });

    if (updateRes.status === "DUPLICATE_FILE")
      return res
        .status(400)
        .json({ message: "There already exists a file with this name." });

    res.status(200).json({
      message: "File updated.",
      ...(updateRes.fileToken && { fileToken: updateRes.fileToken }),
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

//Hard delete
export const deleteFile = async (req: Request, res: Response) => {
  const originalname = req.params.originalname;
  if (!originalname || typeof originalname !== "string")
    return res.status(400).json({ message: "File not found" });
  const userId = (req as any).userId;

  try {
    const result = await deleteAllService(userId, originalname);
    if (result === "NO_FILE") {
      return res.status(400).json({ message: "File doesn't exist." });
    }

    res.status(200).json({ message: "File deleted." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getVersion = async (req: Request, res: Response) => {
  const fileToken = req.params.token;
  if (!fileToken || typeof fileToken !== "string")
    return res.status(400).json({ message: "Please send the token" });
  try {
    const sharedFile = await prisma.fileShare.findUnique({
      where: {
        token: fileToken,
      },
    });

    if (!sharedFile)
      return res.status(400).json({ message: "Please check your fileToken." });

    const fileVersion = await prisma.fileVersion.findUnique({
      where: {
        id: sharedFile.versionId,
      },
    });

    const s3Key = fileVersion?.s3Key as string;
    const stream = await storage.get(s3Key);

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `inline;`);
    stream.pipe(res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
//this deletes the latest version
export const deleteVersion = async (req: Request, res: Response) => {
  const originalname = req.params.originalname;
  const userId = (req as any).userId;
  if (!originalname || typeof originalname !== "string")
    return res.status(400).json({ message: "Incomplete input." });

  try {
    const saved = await findUserFile(userId, originalname);
    if (!saved.success)
      return res.status(404).json({ message: "File doesn't exist." });

    await prisma.$transaction(async (tx) => {
      const deleted = await tx.fileVersion.delete({
        where: { id: saved.savedFile?.latestId! },
      });

      const pendingDeleteRecord = await tx.pendingDelete.create({
        data: { s3Key: deleted.s3Key },
      });

      const remainingVersions = await tx.file.findUnique({
        where: { id: saved.savedFile?.id! },
        include: { versions: { orderBy: { createdAt: "desc" } } },
      });

      if (remainingVersions?.versions.length! > 0) {
        await tx.file.update({
          where: { id: remainingVersions?.id! },
          data: { latestId: remainingVersions?.versions[0]?.id! },
        });
      } else {
        await tx.file.delete({ where: { id: saved.savedFile?.id! } });
      }
    });

    return res.status(200).json({ message: "Deleted the latest version." });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
