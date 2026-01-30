import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Credentials } from "../config/creds";
export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Send the token" });
  const secret = Credentials.JWT_SECRET;
  if (!secret) return res.status(500).json({ message: "" });

  const userId = await jwt.verify(token, secret);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  (res as any).userId = userId;
  next();
}
