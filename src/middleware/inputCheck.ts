import { Request, Response, NextFunction, response } from "express";
import z from "zod";

const inputSchema = z.object({
  username: z.string().min(3).max(7),
  password: z.string().min(3).max(7),
});

export const inputCheck = (req: Request, res: Response, next: NextFunction) => {
  const parsedData = inputSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({ 
        message: "Invalid input",
        errors: parsedData.error.flatten(),
    });
  }
  console.log(req.body);
  req.body = parsedData.data;
  next();
};
