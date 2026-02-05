import { Readable } from "stream";

export interface StorageProvider {
  save(file: Express.Multer.File, key: string): Promise<string>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<Readable>;
}
