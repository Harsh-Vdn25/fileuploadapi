import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const isPrismaUniqueError = (e: unknown): boolean => {
  return (
    e instanceof PrismaClientKnownRequestError && e.code === "P2002"
  );
};
