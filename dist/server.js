"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promises_1 = __importDefault(require("node:fs/promises"));
const multerConfig_1 = require("./config/multerConfig");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const fileInfo = [];
const folder = "uploads";
app.post("/", multerConfig_1.upload.single("file"), (req, res) => {
    if (!req.file)
        return res.status(400).json({ message: "File not found" });
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
app.get("/", async (req, res) => {
    const filename = req.query.name;
    try {
        const file = fileInfo.find((x) => x.originalname === filename);
        if (!file) {
            return res.status(400).json({ message: "File doesnot exist" });
        }
        const filePath = path_1.default.join(process.cwd(), folder, file.filename);
        res.download(filePath);
    }
    catch (err) {
        console.log("Error getting files:", err);
    }
});
app.delete("/", async (req, res) => {
    const { filename } = req.body;
    console.log(req.body);
    if (!filename)
        return res.status(400).json({ message: "Invalid request" });
    try {
        const file = fileInfo.find((x) => x.originalname === filename);
        if (!file) {
            return res.status(404).json({ message: "File not found." });
        }
        const fileDeleted = await promises_1.default.unlink(path_1.default.join(process.cwd(), folder, filename));
        for (let i = 0; i < fileInfo.length; i++) {
            if (fileInfo[i]?.originalname === filename) {
                fileInfo.slice(i, 1);
                break;
            }
        }
        res.status(200).json({
            filename: fileDeleted,
            message: "Deleted the file",
        });
    }
    catch (err) {
        console.log(err);
    }
});
app.listen(5000, () => {
    console.log("App is running on port 5000");
});
//# sourceMappingURL=server.js.map