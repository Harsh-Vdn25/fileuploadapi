import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
dotenv.config({
  path: ".env.test",
});
export const mockPrisma = mockDeep<PrismaClient>();

vi.mock("../config/prismaClient", () => ({
  prisma: mockPrisma,
}));


beforeEach(() => {
  mockReset(mockPrisma);
});
