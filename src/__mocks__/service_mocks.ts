export const token = "abc-abc-abc-abc-abc";
export const mockFileReturn = {
  id: "xxx",
  originalname: "hello.txt",
  ownerid: 1,
  latestId: "latest",
  mimeType: "idk",
  latestHash: "fake_hash",
  isPrivate: false,
};
export const mockFileVersions = {
  id: mockFileReturn.id,
  latestId: mockFileReturn.latestId,
  originalname: mockFileReturn.originalname,
  ownerid: mockFileReturn.ownerid,
  mimeType: mockFileReturn.mimeType,
  isPrivate: mockFileReturn.isPrivate,
  latestHash: mockFileReturn.latestHash,
  versions: [
    {
      id: "version-id",
      fileId: mockFileReturn.id,
      version: 1,
      s3key: "s3-key",
      createdAt: new Date(),
    },
  ],
};

export const mockFileShare = {
  id: 1,
  token: "test-token-abc123",
  versionId: 1,
  createdAt: new Date("2024-01-01"),
};