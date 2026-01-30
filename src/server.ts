import express, { Request, Response } from "express";

import fs from "node:fs/promises";
import { upload } from "./config/multerConfig";
import path from "path";
import { verifyToken } from "./middleware/verifyToken";

const app = express();
app.use(express.json());

const fileInfo: {
  originalName: string,
  generatedName: string
}[] = [];

console.log(path.join(process.cwd(),"uploads"));
const ROOT_DIR = path.resolve(__dirname,"..");
const UPLOAD_DIR = path.join(ROOT_DIR,"uploads");

app.post("/", verifyToken,upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "File not found" });
  fileInfo.push({
    originalName: req.file.originalname,
    generatedName: req.file.filename,
  });

  res.json({
    message: "File uploaded successfully",
    file: req.file,
  });
});

app.get("/", async (req: Request, res: Response) => {
  const filename = req.query.name;
  try {
    const file = fileInfo.find((x) => x.originalName === filename);

    if (!file) {
      return res.status(400).json({ message: "File doesnot exist" });
    }
    const filePath = path.join(UPLOAD_DIR,file.generatedName);
    console.log(filePath);
    res.download(filePath);
  } catch (err) {
    console.log("Error getting files:", err);
  }
});

app.delete("/", async (req: Request, res: Response) => {
  const { filename } = req.body;
  console.log(req.body);
  if (!filename) return res.status(400).json({ message: "Invalid request" });
  try {
    const file = fileInfo.find((x) => x.originalName === filename);
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }
    const fileDeleted = await fs.unlink(
      path.join(UPLOAD_DIR,file.generatedName),
    );
    for(let i=0;i<fileInfo.length;i++){
        if(fileInfo[i]?.originalName === filename){
            fileInfo.splice(i,1);
            break;
        }
    }
    res.status(200).json({
      filename: fileDeleted,
      message: "Deleted the file",
    });
  } catch (err) {
    console.log(err);
  }
});

app.listen(5000, () => {
  console.log("App is running on port 5000");
});
