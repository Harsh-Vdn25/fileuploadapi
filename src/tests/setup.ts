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

// vi.mock("../storage/S3Storage.ts", () => {
//   const mockSave = vi.fn();
//   const mockDelete = vi.fn();
//   const mockGet = vi.fn();

//   const storage = {
//     save :mockSave,
//     delete : mockDelete,
//     get : mockGet,
//   }

//   return {
//     S3Storage: vi.fn(()=>storage),
//     __mockSave: mockSave,
//     __mockDelete: mockDelete,
//     __mockGet: mockGet,
//   };
// });

beforeEach(() => {
  mockReset(mockPrisma);
});
