import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { JWT_SECRET_KEY } from "../config";

declare global {
    namespace Express {
        interface Request {
            userId?: string
        }
    }
}

export const userMiddleware = ((req: Request, res: Response, next: NextFunction): void => {
    try {
        const accessToken = req.cookies['accessToken'];
        if(!accessToken) {
            throw new Error("Unauthorized");
        }

        const decoded = jwt.verify(accessToken, JWT_SECRET_KEY) as { id: string };
        req.userId = decoded.id;
        next(); 
    } catch (error) {
        res.status(401).json({ message: "Unauthorized"})
        return;
    }
});