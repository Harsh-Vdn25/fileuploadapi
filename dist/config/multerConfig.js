"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, path_1.default.join(process.cwd(), "uploads")), //file location
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + Math.round(Math.round(Math.random() * 1e9));
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
exports.upload = (0, multer_1.default)({ storage: storage });
//# sourceMappingURL=multerConfig.js.map