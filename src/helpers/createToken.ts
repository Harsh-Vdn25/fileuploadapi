import jwt from "jsonwebtoken";
import { Credentials } from "../config/creds";

export const createToken = ({ userId }: { userId: number }) => {
  const secret = Credentials.JWT_SECRET!;
  const token = jwt.sign(
    {
      id: userId,
    },
    secret,
    {
      expiresIn: "2d",
    },
  );
  return token;
};
