import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null,path.join(process.cwd(),"uploads")), //file location
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + Math.round(Math.round(Math.random() * 1e9));
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
export const upload = multer({ storage: storage });
