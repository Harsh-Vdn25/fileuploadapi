import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { Readable } from "stream";
import { StorageProvider } from "./storageProvider";
import { Credentials } from "../config/creds";

export class S3Storage implements StorageProvider {
  private s3 = new S3Client({ region: Credentials.AWS_REGION! });
  private bucket = Credentials.AWS_S3_BUCKET;

  async save(file: Express.Multer.File,key:string): Promise<string> {

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket!,
        Body: file.buffer,
        Key: key,
        ContentType: file.mimetype,
      }),
    );
    return key;
  }
  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket!,
        Key: key,
      }),
    );
  }
  async get(key: string): Promise<Readable> {
    const res = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket!,
        Key: key,
      }),
    );
    return res.Body as Readable;
  }
}
