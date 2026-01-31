import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Credentials } from "../config/creds";
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Send the token" });
  try {
    const tokenInfo = await jwt.verify(token, Credentials.JWT_SECRET!);
    if (typeof tokenInfo === "string")
      return res.status(401).json({ message: "Invalid token" });
    (req as any).userId = tokenInfo.id;
    next();
  } catch (err) {
    res.status(401).json({ message: err });
  }
};
