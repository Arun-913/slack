"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const crypto_1 = require("crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
const config_1 = require("../config");
exports.userRouter = (0, express_1.Router)();
const hashPassword = (password) => {
    return (0, crypto_1.createHmac)('sha256', config_1.SECRET_KEY).update(password).digest().toString('hex');
};
exports.userRouter.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const parsedData = types_1.SignUpZodSchema.safeParse(body);
    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return;
    }
    const userExists = yield db_1.prismaClient.user.findFirst({
        where: {
            email: parsedData.data.email
        }
    });
    if (userExists) {
        res.status(403).json({
            message: "User already exists"
        });
        return;
    }
    const hashedPassword = hashPassword(parsedData.data.password);
    yield db_1.prismaClient.user.create({
        data: {
            username: parsedData.data.username,
            email: parsedData.data.email,
            password: hashedPassword
        }
    });
    res.json({
        message: "Registration successfully created, please sign in"
    });
}));
exports.userRouter.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const parsedData = types_1.SignInZodSchema.safeParse(body);
    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return;
    }
    const userExists = yield db_1.prismaClient.user.findFirst({
        where: {
            email: parsedData.data.email
        }
    });
    if (!userExists) {
        res.status(403).json({
            message: "User doesn't exist"
        });
        return;
    }
    if (hashPassword(parsedData.data.password) !== userExists.password) {
        res.status(411).json({
            message: "Credentials are incorrect"
        });
        return;
    }
    const token = jsonwebtoken_1.default.sign({
        id: userExists.id,
        username: userExists.username
    }, config_1.JWT_SECRET_KEY);
    res.json({
        token: token,
    });
}));
exports.userRouter.get('/signout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: "Sign out successfully" });
});
exports.userRouter.get('/refresh-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies['refreshToken'];
        if (!refreshToken) {
            throw new Error("Unauthorized");
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.JWT_REFRESH_KEY);
        const user = yield db_1.prismaClient.user.findUnique({
            where: {
                id: decoded.id
            }
        });
        if (!user || user.refreshToken !== decoded.refreshToken) {
            throw new Error("Invalid token");
        }
        let accessToken = jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.username
        }, config_1.JWT_SECRET_KEY, { expiresIn: '10m' });
        let now = new Date();
        res.cookie('accessToken', accessToken, {
            sameSite: 'strict',
            path: '/',
            httpOnly: true,
            secure: true,
            expires: new Date(now.getTime() + (1000 * 60 * 60))
        }).json({ message: "Token refreshed successfully" });
        return;
    }
    catch (error) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
}));
exports.userRouter.get('/check-auth', (req, res) => {
    try {
        const accessToken = req.cookies['accessToken'];
        if (!accessToken) {
            throw new Error("Unauthorized");
        }
        jsonwebtoken_1.default.verify(accessToken, config_1.JWT_SECRET_KEY);
        res.status(200).json({ message: "Authorized" });
    }
    catch (error) {
        // console.log(error);
        res.status(401).json({ message: "Unauthorized" });
    }
});
