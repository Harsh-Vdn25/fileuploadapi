import express from "express";
import { verifyToken } from "../middleware/verifyToken";
import {
  deleteFile,
  deleteVersion,
  getFile,
  getVersion,
  updateFile,
  uploadFile,
} from "../controllers/file.controller";
import { upload } from "../config/multerConfig";
import { rateLimiter } from "../middleware/rateLimiter";

export const fileRouter = express.Router();

fileRouter.post("/", rateLimiter,verifyToken, upload.single("file"), uploadFile);
fileRouter.get("/:filename", rateLimiter,verifyToken, getFile);
fileRouter.put("/:filename", rateLimiter,verifyToken, upload.single("file"), updateFile);
fileRouter.delete("/allVersions/:filename", rateLimiter,verifyToken, deleteFile);
fileRouter.get("/:filename/:version",rateLimiter,verifyToken,getVersion);
fileRouter.delete("/latest/:filename",rateLimiter,verifyToken,deleteVersion);