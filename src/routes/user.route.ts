import express from 'express';
import { signin, signup } from '../controllers/user.controller';
import { inputCheck } from '../middleware/inputCheck';

export const userRouter = express.Router();

userRouter.post('/signup',inputCheck,signup);
userRouter.post('/signin',inputCheck,signin);