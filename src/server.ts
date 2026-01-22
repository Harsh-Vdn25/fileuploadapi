import express, { Request, Response } from "express";
import fs from "node:fs/promises";
import { upload } from "./config/multerConfig";
import path from "path";

const app = express();
app.use(express.json());

const fileInfo: {
  originalname: string,
  filename: string
}[] = [];

const folder = "uploads";

app.post("/", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "File not found" });
  fileInfo.push({
    originalname: req.file.originalname,
    filename: req.file.filename,
  });
  console.log(fileInfo);

  res.json({
    message: "File uploaded successfully",
    file: req.file,
  });
});

app.get("/", async (req: Request, res: Response) => {
  const filename = req.query.name;
  try {
    const file = fileInfo.find((x) => x.originalname === filename);
    
    if (!file) {
      return res.status(400).json({ message: "File doesnot exist" });
    }
    const filePath = path.join(process.cwd(),folder,file.filename);

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
    const file = fileInfo.find((x) => x.originalname === filename);
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }
    const fileDeleted = await fs.unlink(
      path.join(process.cwd(), folder, filename),
    );
    
    for(let i=0;i<fileInfo.length;i++){
        if(fileInfo[i]?.originalname === filename){
            fileInfo.slice(i,1);
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
