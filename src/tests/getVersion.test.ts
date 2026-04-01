import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReq, mockRes } from "../__mocks__/req_res_mocks";
import { getVersion } from "../controllers/file.controller";
import { mockPrisma } from "./setup";
import { mockFileShare, mockFileVersions } from "../__mocks__/service_mocks";

vi.mock("../storage/S3Storage",()=>({
    storage: {
        get: vi.fn()
    }
}))

const mockStream = { pipe: vi.fn() };

import { storage } from "../storage/S3Storage";

describe("getVersion controller",()=>{
    beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when token is missing", async () => {
    const req = mockReq({});
    const res = mockRes();

    await getVersion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Please send the token",
    });
    expect(mockPrisma.fileShare.findUnique).not.toHaveBeenCalled();
  });
})