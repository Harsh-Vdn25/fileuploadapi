import { Prisma } from "@prisma/client";

export const isPrismaUniqueError = (e: unknown): boolean => {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
};
