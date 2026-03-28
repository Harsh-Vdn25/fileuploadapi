import { describe, expect, it, vi } from "vitest";

vi.mock("../../helpers/contentHash.ts",()=>({
    getFileHash: vi.fn()
}))

vi.mock("../../helpers/fileHelper.ts",()=>({
    findUserFile: vi.fn(),
    findUserFileByHash: vi.fn(),
    randomID: vi.fn()
}))

vi.mock("crypto",()=>({
    randomUUID: vi.fn()
}))

vi.mock("../../storage/S3Storage", () => {
  return {
    storage: {
      save: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    },
  };
});

const token = "abc-abc-abc-abc-abc";
export const mockFileReturn={
    id:"xxx",
    originalname:"hello.txt",
    ownerid: 1,
    latestId:"latest",
    mimeType:"idk",
    latestHash:"fake_hash",
    isPrivate: false
}


import { getFileHash } from "../../helpers/contentHash";
import { findUserFile, findUserFileByHash, randomID } from "../../helpers/fileHelper";
import {  uploadService } from "../../services/file.service";
import { mockFile } from "../../__mocks__/req_res_mocks";
import { storage } from "../../storage/S3Storage";
import { randomUUID } from "crypto";
import { mockPrisma } from "../setup";

describe("Testing upload service",()=>{
    it("return duplicate file incase of hash match",async()=>{
        vi.mocked(getFileHash).mockResolvedValue("fake_hash");
        vi.mocked(findUserFileByHash).mockResolvedValue({success: true,savedFile: mockFileReturn})

        const res = await uploadService(mockFile,1,false);
        
        expect(res.status).toBe("DUPLICATE_FILE");
    })
    
    it("return FILE_EXISTS if file with same name",async()=>{
        vi.mocked(getFileHash).mockResolvedValue("fake_hash");
        vi.mocked(findUserFileByHash).mockResolvedValue({success: false,savedFile: mockFileReturn})

        vi.mocked(findUserFile).mockResolvedValue({success:true,savedFile: mockFileReturn as any})
        const res = await uploadService(mockFile,1,false);
        
        expect(res.status).toBe("FILE_EXISTS");
    })

    it("returns SUCCESS if file uploaded successfully",async()=>{
        vi.mocked(randomID).mockResolvedValue("generated_name");
        vi.mocked(getFileHash).mockResolvedValue("fake_hash");
        vi.mocked(findUserFileByHash).mockResolvedValue({success: false,savedFile: mockFileReturn})

        vi.mocked(findUserFile).mockResolvedValue({success:false,savedFile: mockFileReturn as any});
        vi.mocked(randomUUID).mockReturnValue(token);
        vi.mocked(storage.save).mockResolvedValue("mock-value");

        //Database
        mockPrisma.$transaction.mockImplementation((callback)=>callback(mockPrisma));
        mockPrisma.file.create.mockResolvedValue({
            id: "fileid",
            originalname: "dassd",
            ownerid: 1,
            mimeType: "yyy",
            isPrivate: false,
            latestHash: "zzz",
            latestId: "asdasda",
            //@ts-ignore
            versions:[
                {id:"123"}
            ]
        })
        const res = await uploadService(mockFile,1,false) as {status:"SUCCESS",fileToken:string};

        expect(mockPrisma.file.update).toHaveBeenCalled();
        expect(mockPrisma.fileShare.create).toHaveBeenCalled();
        expect(res.status).toBe("SUCCESS");
        expect(res.fileToken).toBe(token);
    })

    it("Throw error if the transaction fails",async()=>{
                
        vi.mocked(randomID).mockResolvedValue("generated_name");
        vi.mocked(getFileHash).mockResolvedValue("fake_hash");
        vi.mocked(findUserFileByHash).mockResolvedValue({success: false,savedFile: mockFileReturn})

        vi.mocked(findUserFile).mockResolvedValue({success:false,savedFile: mockFileReturn as any});
        vi.mocked(randomUUID).mockReturnValue(token);
        vi.mocked(storage.save).mockResolvedValue("mock-value");

        vi.mocked(mockPrisma.$transaction).mockRejectedValue(new Error("Something went wrong"));

        await expect(uploadService(mockFile,1,false)).rejects.toThrow("Something went wrong");
        expect(storage.delete).toHaveBeenCalled();
    })
})