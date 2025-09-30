import { Router, Request, Response } from "express";
import { prismaClient } from "../db";
import { createHmac } from 'crypto';
import jwt from 'jsonwebtoken'; 
import { SignInZodSchema, SignUpZodSchema } from "../types";
import { JWT_REFRESH_KEY, JWT_SECRET_KEY, SECRET_KEY } from "../config";

export const userRouter = Router();

const hashPassword = (password: string) => {
    return createHmac('sha256', SECRET_KEY).update(password).digest().toString('hex');
}

userRouter.post('/signup', async (req: Request, res: Response) => {    
    const body = req.body;
    const parsedData = SignUpZodSchema.safeParse(body);
    
    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return
    }
    
    const userExists = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.email
        }
    });
    
    if (userExists) {
        res.status(403).json({
            message: "User already exists"
        });
        return
    }
    
    const hashedPassword = hashPassword(parsedData.data.password);
    await prismaClient.user.create({
        data: {
            username: parsedData.data.username,
            email: parsedData.data.email,
            password: hashedPassword
        }
    });
    
    res.json({
        message: "Registration successfully created, please sign in"
    });
});

userRouter.post('/signin', async (req: Request, res: Response) => {
    const body = req.body;
    const parsedData = SignInZodSchema.safeParse(body);
    
    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return
    }
    
    const userExists = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.email
        }
    });
    
    if (!userExists) {
        res.status(403).json({
            message: "User doesn't exist"
        });
        return
    }
    
    if (hashPassword(parsedData.data.password) !== userExists.password) {
        res.status(411).json({
            message: "Credentials are incorrect"
        });
        return
    }
    
    const token = jwt.sign({
        id: userExists.id,
        username: userExists.username
    }, JWT_SECRET_KEY);
    
    res.json({
        token: token,
    });
});

userRouter.get('/signout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: "Sign out successfully" });
});

userRouter.get('/refresh-token', async (req, res) => {
    try {
        const refreshToken = req.cookies['refreshToken'];
        if(!refreshToken) {
            throw new Error("Unauthorized");
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_KEY) as {id: string, refreshToken: string};
        const user = await prismaClient.user.findUnique({
            where: {
                id: decoded.id
            }
        });

        if(!user || user.refreshToken !== decoded.refreshToken) {
            throw new Error("Invalid token");
        }

        let accessToken = jwt.sign({
            id: user.id,
            username: user.username
        }, JWT_SECRET_KEY, { expiresIn: '10m' });

        let now = new Date();
        res.cookie('accessToken', accessToken, {
            sameSite: 'strict',
            path: '/',
            httpOnly: true,
            secure: true,
            expires: new Date(now.getTime() + (1000 * 60 * 60))
        }).json({ message: "Token refreshed successfully" });
        return
    } catch (error) {
        res.status(401).json({ message: "Unauthorized"})
        return;
    }
});

userRouter.get('/check-auth', (req, res) => {
    try {
        const accessToken = req.cookies['accessToken'];
        if(!accessToken) {
           throw new Error("Unauthorized");
        }

        jwt.verify(accessToken, JWT_SECRET_KEY);
        res.status(200).json({ message: "Authorized" });
    } catch (error) {
        // console.log(error);
        res.status(401).json({ message: "Unauthorized" });
    }
});