import { expect, describe, it, vi, beforeEach } from "vitest";
import request from "supertest";
import { prismaClient } from "../__mocks__/db";
import { createToken } from "../helpers/createToken";
import { hashPassword } from "../helpers/hashPassword";

vi.mock("../config/prismaClient", () => ({
  prisma: prismaClient,
}));
vi.mock("../helpers/createToken", () => ({
  createToken: vi.fn(),
}));

vi.mock("../helpers/hashPassword", () => ({
  hashPassword: vi.fn(),
}));

import app from "../server";

describe("POST/api/user/signup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects the request when the password field is missing", async () => {
    const res = await request(app).post("/api/user/signup").send({
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

  it("Inform user if the user already present", async () => {
    prismaClient.user.findUnique.mockResolvedValue({
      id: 1,
      username: "Harsha",
      password: "123456",
      createdAt: new Date(),
    });

    const res = await request(app).post("/api/user/signup").send({
      username: "harsha",
      password: "1234",
    });

    expect(res.body.message).toBe("username already exists.");
  });

  it("creates a user and returns a token", async () => {
    prismaClient.user.findUnique.mockResolvedValue(null);
    vi.mocked(createToken).mockReturnValue("fake_token");//this is not asynchronous in the code
    vi.mocked(hashPassword).mockResolvedValue("hash_pass");
    prismaClient.user.create.mockResolvedValue({
      id: 1,
      username: "harsha",
      password: "hash_pass",
      createdAt: new Date(),
    });

    const res = await request(app).post("/api/user/signup").send({
      username: "Harsha",
      password: "mypass",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Signed up successfully.");
    expect(res.body.token).toBe("fake_token");
  });
});
