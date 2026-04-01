import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma } from "../setup";
import {
  mockFileReturn,
  mockFileVersions,
} from "../../__mocks__/service_mocks";
import { deleteAllService } from "../../services/file.service";

describe("Testing deleteAll Service", () => {
  beforeEach(() => {
    vi.mocked(mockPrisma.file.findUnique).mockResolvedValue(mockFileVersions);
    mockPrisma.$transaction.mockImplementation((callback) =>
      callback(mockPrisma),
    );
  });

  it("returns NO_FILE when the file does not exist", async () => {
    vi.mocked(mockPrisma.file.findUnique).mockResolvedValue(null);

    const result = await deleteAllService(1, mockFileReturn.originalname);
    expect(result).toBe("NO_FILE");
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns success on sucessfully deleting the file", async () => {
    vi.mocked(mockPrisma.file.delete).mockResolvedValue(mockFileReturn);
    vi.mocked(mockPrisma.pendingDelete.create).mockResolvedValue({
      count: 5,
    } as any);

    const deleteAllRes = await deleteAllService(1, mockFileReturn.originalname);

    expect(deleteAllRes).toBe("SUCCESS");
  });

  it("throws when the transaction rejects", async () => {
    const dbError = new Error("DB connection failed");
    vi.mocked(mockPrisma.file.findUnique).mockResolvedValue(mockFileVersions);
    mockPrisma.$transaction.mockRejectedValue(dbError);
    await expect(
      deleteAllService(1, mockFileReturn.originalname),
    ).rejects.toThrow("DB connection failed");
  });
});
