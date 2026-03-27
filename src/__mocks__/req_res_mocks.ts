import { vi } from "vitest";

interface mockReqType {
  file?: Express.Multer.File;
  filename?: string;
  version?: number;
  userId: number ;
}

export const mockReq = ({
  file,
  filename,
  version,
  userId,
}: mockReqType) => {
  return {
    file,
    params: {
      filename,
      version,
    },
    userId,
  } as any;
};

export const mockRes = () => {
  const json = vi.fn();
  const status = vi.fn().mockImplementation(() => ({ json }));
  return {
    res: { status },
    status,
    json,
  } as any;
};

export const mockFile = {
  originalname: "hello.txt",
  mimetype: "text/plain",
  size: 123,
  buffer: Buffer.from("hello world"),
} as Express.Multer.File;
