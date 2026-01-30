import { Request, Response } from "express";
import { prisma } from "../config/prismaClient";
import bcrypt from "bcrypt";
import { createToken } from "../helpers/createToken";
import { hashPassword } from "../helpers/hashPassword";

export const signup = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const userCheck = await prisma.user.findUnique({
      where: { username },
    });
    if (userCheck) return res.json({ message: "username already exists." });
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
      },
    });
    const token = createToken({ userId: user.id });

    res.status(200).json({
      message: "Signed up successfully.",
      token,
    });
  } catch (err) {
    return res.status(500).json({ message: "Something went wrong." });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ message: "User Not Found" });

    const isAuthorized = await bcrypt.compare(password, user.password);
    if (!isAuthorized) return res.status(401).json({ message: "Unauthorized" });

    const token = createToken({ userId: user.id });
    res.status(200).json({
      message: "Signed in successfully.",
      token,
    });
  } catch (err) {
    return res.status(500).json({ message: "Something went wrong." });
  }
};
