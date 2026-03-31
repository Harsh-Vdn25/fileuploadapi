import {  describe, expect, it, vi } from "vitest";

vi.mock("../../helpers/contentHash", () => ({
  getFileHash: vi.fn(),
}));

vi.mock("../../helpers/fileHelper", () => ({
  findUserFile: vi.fn(),
  findUserFileByHash: vi.fn(),
  randomID: vi.fn(),
}));

vi.mock("crypto", () => ({
  randomUUID: vi.fn(),
}));

vi.mock("../../storage/S3Storage", () => {
  return {
    storage: {
      save: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    },
  };
});

export const mockFileWithVersion = {
  id: "xxx",
  originalname: "hello.txt",
  ownerid: 1,
  latestId: "latest",
  mimeType: "idk",
  latestHash: "fake_hash",
  isPrivate: false,
  latest: {
    id: "version1",
    fileId: "xxx",
    version: 1,
    s3Key: "s3",
    createdAt: new Date()
  }
};

import {  findUserFile, randomID } from "../../helpers/fileHelper";
import { getFileHash } from "../../helpers/contentHash";
import { randomUUID } from "crypto";
import { storage } from "../../storage/S3Storage";
import { mockPrisma } from "../setup";
import { updateService } from "../../services/file.service";
import { mockFile } from "../../__mocks__/req_res_mocks";
import { mockFileReturn, token } from "../../__mocks__/service_mocks";

describe("Testing update service", () => {
  it("Return FILE_NOT_FOUND if file is not found",async()=>{
    vi.mocked(findUserFile).mockResolvedValue({success:false});
    
    const res = await updateService(mockFile,1,"original_name");

    expect(res.status).toBe("FILE_NOT_FOUND");
  })

  it("Return duplicate file",async()=>{
    vi.mocked(findUserFile).mockResolvedValue({
      success: true,
      savedFile:mockFileWithVersion as any,
    });
    vi.mocked(getFileHash).mockResolvedValue("fake_hash");

    const res = await updateService(mockFile,1,"original_name");

    expect(res.status).toBe("DUPLICATE_FILE");
  })

  it("Return success after updating the file", async () => {
    vi.mocked(findUserFile).mockResolvedValue({
      success: true,
      savedFile:mockFileWithVersion as any,
    });
    vi.mocked(mockPrisma.fileVersion.create).mockResolvedValue({
      id: "version-2",
      fileId: mockFileReturn.id,
      version: 2,
      s3Key: "s3key",
      createdAt: new Date(),
    });
    vi.mocked(storage.save).mockResolvedValue("saved-s3");

    vi.mocked(mockPrisma.file.update).mockResolvedValue(mockFileReturn);

    vi.mocked(mockPrisma.fileShare.create).mockResolvedValue({
      id: "share-1",
      versionId: "version-2",
      token,
    });
    vi.mocked(getFileHash).mockResolvedValue("mocked-file-hash");
    vi.mocked(randomID).mockReturnValue("generated-name");
    vi.mocked(randomUUID).mockReturnValue(token);
    vi.mocked(mockPrisma.$transaction).mockImplementation((callback) =>
      callback(mockPrisma),
    );

    const res = (await updateService(mockFile, 1, "originalname")) as {
      status: "SUCCESS";
      fileToken: string;
    };
    
    expect(res.status).toBe("SUCCESS");
    expect(res.fileToken).toBe(token);
  });

  it("Returns error when the upload fails after uploading on S3",async()=>{
    vi.mocked(findUserFile).mockResolvedValue({
      success: true,
      savedFile:mockFileWithVersion as any,
    });
    vi.mocked(mockPrisma.fileVersion.create).mockResolvedValue({
      id: "version-2",
      fileId: mockFileReturn.id,
      version: 2,
      s3Key: "s3key",
      createdAt: new Date(),
    });
    vi.mocked(storage.save).mockResolvedValue("saved-s3");

    mockPrisma.$transaction.mockImplementation((callback)=>callback(mockPrisma));

    vi.mocked(mockPrisma.fileVersion.create).mockImplementation(()=>{throw new Error()});

    await expect(updateService(mockFile,1,"original_name")).rejects.toThrow("");
    expect(storage.delete).toHaveBeenCalled();
  })
});
