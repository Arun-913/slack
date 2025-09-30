"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
exports.userMiddleware = ((req, res, next) => {
    try {
        const accessToken = req.cookies['accessToken'];
        if (!accessToken) {
            throw new Error("Unauthorized");
        }
        const decoded = jsonwebtoken_1.default.verify(accessToken, config_1.JWT_SECRET_KEY);
        req.userId = decoded.id;
        next();
    }
    catch (error) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
});
