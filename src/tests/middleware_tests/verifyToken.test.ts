import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../server";
import jwt from 'jsonwebtoken';

vi.mock("jsonwebtoken",()=>({
  default:{
    verify: vi.fn()
  }
}))

describe("POST /api/file/", () => {
  it("returns an error if there is no token in the header",async()=>{
    const res =await  request(app).post("/api/file/").send();

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Send the token");
  })
  
  it("return error if the token is invalid",async()=>{
    vi.mocked(jwt.verify).mockImplementation(()=>{
      throw new Error();
    })
    const res = await request(app).post("/api/file/").set("Authorization","Bearer xyz");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });
  
});
