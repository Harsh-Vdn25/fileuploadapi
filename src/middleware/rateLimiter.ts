import { Request,Response,NextFunction } from "express";
import { SlidingWindow } from "../utils/slidingWindow";

const rates = new Map();

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
    const ip = req.ip;

    if(!rates.has(ip)){
        rates.set(ip,new SlidingWindow(10,5));
        if(!rates.get(ip).allowRequest()){
            //allowRequest here also records the first request along with tbe checking
            return res.status(429).send("Too many requests");
        }
    }else{
        const user = rates.get(ip);
        if(!user.allowRequest()){
            return res.status(429).send("Too many requests.");
        }
    }
    next();
};
