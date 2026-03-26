import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { mockPrisma } from "./setup";
import { createToken } from "../helpers/createToken";
import bcrypt from "bcrypt";


vi.mock("../helpers/createToken", () => ({
  createToken: vi.fn(),
}));

vi.mock("bcrypt",()=>({
    default:{
        compare: vi.fn(),
    }
}))

import app from "../server";

describe("POST /api/user/signin", () => {
  it("reject the request on incorrect input", async () => {
    const res = await request(app).post("/api/user/signin").send({
      username: "harsha",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid input");
  });

  it("rejects request when fields violate schema constraints", async () => {
    const res = await request(app).post("/api/user/signup").send({
      username: "ha",
      password: "123456",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid input");
  });

  it("returns error if user doesn't exist", async () => {
    await mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post("/api/user/signin").send({
      username: "Harsha",
      password: "1234",
    });

    expect(res.body.message).toBe("User Not Found");
  });

  it("reject request if user exists but password is incorrect",async()=>{
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({
        id: 1,
        username: "Harsha",
        password: "hashpass",
        createdAt: new Date()
    })
    vi.mocked(bcrypt.compare as any).mockResolvedValue(false);

    const res = await request(app).post("/api/user/signin").send({
        username: "Harsha",
        password: "1234"
    })

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  })

  it("return token if the user credentials are correct",async()=>{
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({
        id: 1,
        username: "Harsha",
        password: "hashpass",
        createdAt: new Date()
    })
    vi.mocked(bcrypt.compare as any).mockResolvedValue(true);
    vi.mocked(createToken).mockReturnValue("fake_token");

    const res = await request(app).post("/api/user/signin").send({
        username: "Harsha",
        password: "1234"
    })

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Signed in successfully.");
    expect(res.body.token).toBe("fake_token");
  })
});
