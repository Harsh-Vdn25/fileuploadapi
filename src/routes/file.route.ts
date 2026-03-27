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

fileRouter.get("/:originalname", rateLimiter,verifyToken, getFile);

fileRouter.put("/:originalname", rateLimiter,verifyToken, upload.single("file"), updateFile);

fileRouter.delete("/allVersions/:originalname", rateLimiter,verifyToken, deleteFile);

fileRouter.get("/version/:token",rateLimiter,verifyToken,getVersion);//user with the token can access that version of a file

fileRouter.delete("/latest/:originalname",rateLimiter,verifyToken,deleteVersion);