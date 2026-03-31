import { describe, expect, it, vi } from "vitest";

vi.mock("../../helpers/fileHelper.ts",()=>({
    findUserFile: vi.fn()
}))

const original_name = "original_name";
const userId = 1;

import { findUserFile } from "../../helpers/fileHelper";
import { mockFileReturn } from "../../__mocks__/service_mocks";
import { mockPrisma } from "../setup";
import { deleteVersion } from "../../controllers/file.controller";
import { mockReq, mockRes } from "../../__mocks__/req_res_mocks";
import { prisma } from "../../config/prismaClient";

describe("Tests the deleteVersion function",()=>{
    it("Successfully deletes the requested version",async()=>{
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

        vi.mocked(mockPrisma.file.findUnique).mockResolvedValue({
            id:mockFileReturn.id,
            latestId:mockFileReturn.latestId,
            originalname: mockFileReturn.originalname,
            ownerid:mockFileReturn.ownerid,
            mimeType:mockFileReturn.mimeType,
            isPrivate:mockFileReturn.isPrivate,
            latestHash:mockFileReturn.latestHash,
            versions:[{
                id: "version-id",
                fileId: mockFileReturn.id,
                version: 1,
                s3key: "s3-key",
                createdAt: new Date()
            }]
        } as any)
        
        vi.mocked(mockPrisma.file.update).mockResolvedValue({
            id: mockFileReturn.id,
            latestId: "version-id",
            originalname: mockFileReturn.originalname,
            ownerid: mockFileReturn.ownerid,
            mimeType: mockFileReturn.mimeType,
            isPrivate: mockFileReturn.isPrivate,
            latestHash: "latest-hash"
        })
        
        const res = mockRes();
        const deleteRes = await deleteVersion(mockReq({userId: 1,originalname: "original_name"}),res);
        expect(res?.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({message:"Deleted the latest version."});
    })
})