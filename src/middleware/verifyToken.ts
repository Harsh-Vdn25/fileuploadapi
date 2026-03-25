import jwt, { JwtPayload } from "jsonwebtoken";
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
    const tokenInfo = jwt.verify(token, Credentials.JWT_SECRET!);
    (req as any).userId = (tokenInfo as JwtPayload ).id;
    next();
  } catch (err) {
    res.status(401).json({message: "Invalid token"});
  }
};
