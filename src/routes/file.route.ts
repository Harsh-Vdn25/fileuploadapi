import express from "express";
import { verifyToken } from "../middleware/verifyToken";
import {
  deleteFile,
  getFile,
  updateFile,
  uploadFile,
} from "../controllers/file.controller";
import { upload } from "../config/multerConfig";
import { rateLimiter } from "../middleware/rateLimiter";

export const fileRouter = express.Router();

fileRouter.post("/", verifyToken, upload.single("file"), uploadFile);
fileRouter.get("/:filename", verifyToken,rateLimiter, getFile);
fileRouter.put("/:filename", verifyToken, upload.single("file"), updateFile);
fileRouter.delete("/:filename", verifyToken, deleteFile);
