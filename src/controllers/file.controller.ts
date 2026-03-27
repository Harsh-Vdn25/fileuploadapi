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
  if (!file )
    return res
      .status(400)
      .json({ message: "Send all the required information." });

  try {
    const result = await uploadService(file, userId);
    if (result === "DUPLICATE_FILE") {
      return res.status(400).json({ message: "Duplicate file." });
    }

    res.status(200).json({ message: "Saved the file sucessfully" });
  } catch (err: any) {
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
    await updateService(file, saved.savedFile?.id!, versionNo);

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

export const getVersion = async (req: Request, res: Response) => {
  const filename = req.params.filename;
  const version = Number(req.params.version);
  const userId = (req as any).userId;
  if (!filename || typeof filename !== "string" || !version)
    return res.status(400).json({ message: "Incomplete request." });
  try {
    const saved = await findUserFile(userId, filename);
    if (!saved.success)
      return res.status(404).json({ message: "File doesn't exist." });

    const fileId = saved.savedFile?.id;
    const fileVersion = await prisma.fileVersion.findUnique({
      where: {
        fileId_version: {
          fileId: fileId!,
          version: version,
        },
      },
    });

    if (!fileVersion?.id)
      return res
        .status(404)
        .json({ message: "Requested file version doesn't exist." });

    const s3Key = fileVersion?.s3Key;
    const stream = await storage.get(s3Key);

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${saved.savedFile?.originalname}"`,
    );
    stream.pipe(res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteVersion = async (req: Request, res: Response) => {
  const filename = req.params.filename;
  const userId = (req as any).userId;
  if (!filename || typeof filename !== "string")
    return res.status(400).json({ message: "Incomplete input." });

  try {
    const saved = await findUserFile(userId, filename);
    if (!saved.success)
      return res.status(404).json({ message: "File doesn't exist." });

    await prisma.$transaction(async (tx) => {
      const deleted = await tx.fileVersion.delete({
        where: {
          id: saved.savedFile?.latestId!,
        },
      });

      await tx.pendingDelete.create({
        data: {
          s3Key: deleted.s3Key,
        },
      });

      const remainingVersions = await tx.file.findUnique({
        where: { id: saved.savedFile?.id! },
        include: { versions: true },
      });

      if (remainingVersions?.versions.length! > 0) {
        // 4️⃣ Update latestId to newest remaining version
        await tx.file.update({
          where: { id: remainingVersions?.id! },
          data: {
            latestId: remainingVersions?.versions[0]?.id!,
          },
        });
      } else {

        await tx.file.delete({
          where: { id: saved.savedFile?.id!},
        });
      }
    });
    res.status(200).json({message: "Deleted the latest version."})
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
