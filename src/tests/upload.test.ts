import { describe,expect,it,vi } from "vitest";
import { mockReq, mockRes } from "../__mocks__/req_res_mocks";

//mock the upload Service
vi.mock("../services/file.service.ts",()=>{
    return {
        uploadService: vi.fn(),
    }
})

vi.mock("crypto",()=>({
    randomUUID:vi.fn()
}))

import { uploadService } from "../services/file.service";
import { uploadFile } from "../controllers/file.controller";
import { mockFile } from "../__mocks__/req_res_mocks";
import { randomUUID } from "crypto";

describe("POST /api/file",()=>{
    it("return error if user sends invalid input(file not sent)",async()=>{
        const {res,status,json} = mockRes();

        await uploadFile(mockReq({filename:"hello.txt",version:1,userId: 1,isPrivate:false}),res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({message: "Send all the required information."});
    });

    it("upload service throws error",async()=>{
        const {res,status,json} = mockRes();
        vi.mocked(uploadService).mockImplementation(()=>{throw new Error("")});

        await uploadFile(mockReq({file:mockFile,filename:"hello.txt",version:1,userId: 1,isPrivate: true}),res)

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({message: "Something went wrong."});
    })

    it("Duplicate file error",async()=>{
        const {res,status,json} = mockRes();
        vi.mocked(uploadService).mockResolvedValue({status: "DUPLICATE_FILE"});

        await uploadFile(mockReq({file:mockFile,filename:"hello.txt",version:1,userId:1,isPrivate:false}),res);

        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith({message: "Duplicate file."});
    })

    it("File exists error",async()=>{
        const {res,status,json} = mockRes();
        vi.mocked(uploadService).mockResolvedValue({status: "FILE_EXISTS"});

        await uploadFile(mockReq({file:mockFile,filename:"hello.txt",version:1,userId:1,isPrivate:false}),res);

        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith({message: "File with the same name exists."});
    })

    it("file uploaded successfully",async()=>{
        const {res,status,json} = mockRes();
        const token = "aaa-bbb-ccc-ddd-eee";
        vi.mocked(randomUUID).mockReturnValue(token);
        vi.mocked(uploadService).mockResolvedValue({status:"SUCCESS",fileToken:token});

        await uploadFile(mockReq({file:mockFile,filename:"hello.txt",version:1,userId: 1}),res)

        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith({message: "Saved the file sucessfully",fileToken: token});
    })
})