import express from 'express';
import { signin, signup } from '../controllers/user.controller';
import { inputCheck } from '../middleware/inputCheck';
import { rateLimiter } from '../middleware/rateLimiter';

export const userRouter = express.Router();

userRouter.post('/signup',inputCheck,rateLimiter,signup);
userRouter.post('/signin',inputCheck,rateLimiter,signin);