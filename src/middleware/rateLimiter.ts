import { Request,Response,NextFunction } from "express";
import { SlidingWindow } from "../utils/slidingWindow";

const rates = new Map();

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
    const userId = Number((req as any).userId);
    if(!rates.has(userId)){
        rates.set(userId,new SlidingWindow(10,2));
        if(!rates.get(userId).allowRequest()){
            return res.status(429).send("Too many requests");
        }
    }else{
        const user = rates.get(userId);
        if(!user.allowRequest()){
            return res.status(429).send("Too many requests.");
        }
    }
    next();
};
