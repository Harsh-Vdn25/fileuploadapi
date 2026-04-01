import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../helpers/fileHelper.ts",()=>({
    findUserFile: vi.fn()
}))

import { findUserFile } from "../helpers/fileHelper";
import { mockFileReturn } from "../__mocks__/service_mocks";
import { mockPrisma } from "./setup";
import { deleteVersion } from "../controllers/file.controller";
import { mockReq, mockRes } from "../__mocks__/req_res_mocks";
import { mockFileVersions } from "../__mocks__/service_mocks";

describe("Tests the deleteVersion function",()=>{
    let res:any;
    beforeEach(()=>{
        res = mockRes();
        vi.mocked(findUserFile).mockResolvedValue({success:true,savedFile:mockFileReturn as any});
        mockPrisma.$transaction.mockImplementation((callback)=>callback(mockPrisma));

        vi.mocked(mockPrisma.fileVersion.delete).mockResolvedValue({
            id: mockFileReturn.latestId,
            createdAt: new Date(),
            fileId: "file-id",
            version: 2,
            s3Key: "s3_key"
        })

        vi.mocked(mockPrisma.pendingDelete.create).mockResolvedValue({
            id: "someid",
            s3Key: "s3_key",
            createdAt: new Date(),
            attempts: 0
        });
    })

    it("Returns 400 if originalname is missing", async () => {
        await deleteVersion(mockReq({ userId: 1}), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Incomplete input." });
        expect(findUserFile).not.toHaveBeenCalled(); 
    }); 

    it("Returns 404 if the file doesn't exist", async () => {
        vi.mocked(findUserFile).mockResolvedValue({ success: false });

        await deleteVersion(mockReq({ userId: 1, originalname: "original_name" }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "File doesn't exist." });
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("Successfully deletes the requested version",async()=>{
        vi.mocked(mockPrisma.file.findUnique).mockResolvedValue(mockFileVersions as any)
        
        vi.mocked(mockPrisma.file.update).mockResolvedValue(mockFileReturn);
        
        await deleteVersion(mockReq({userId: 1,originalname: "original_name"}),res);
        expect(res?.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({message:"Deleted the latest version."});
    })

    it("Delete the file if the 1st version is the latest",async()=>{

        vi.mocked(mockPrisma.file.findUnique).mockResolvedValue({
            id:mockFileReturn.id,
            latestId:mockFileReturn.latestId,
            originalname: mockFileReturn.originalname,
            ownerid:mockFileReturn.ownerid,
            mimeType:mockFileReturn.mimeType,
            isPrivate:mockFileReturn.isPrivate,
            latestHash:mockFileReturn.latestHash,
            versions:[]
        } as any);

        vi.mocked(mockPrisma.file.delete).mockResolvedValue(mockFileReturn);

        await deleteVersion(mockReq({userId: 1,originalname:"original_name",}),res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({message:"Deleted the latest version."});
    })
    
    it("Return an error if the transaction fails",async()=>{
        vi.mocked(mockPrisma.fileVersion.delete).mockImplementation(()=>{
            throw new Error()
        })
        await deleteVersion(mockReq({userId:1,originalname: "original_name"}),res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({message: "Internal server error"});
    })
})