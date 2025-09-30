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
Object.defineProperty(exports, "__esModule", { value: true });
exports.directMessageRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const user_1 = require("../middleware/user");
exports.directMessageRouter = (0, express_1.Router)();
exports.directMessageRouter.use(user_1.userMiddleware);
exports.directMessageRouter.get('/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("req.params.userId: ", req.params.userId);
    try {
        if (!req.params.userId || req.userId === req.params.userId) {
            res.status(400).json({ message: "Invalid user id" });
            return;
        }
        const mssages = yield db_1.prismaClient.directMessage.findMany({
            where: {
                OR: [
                    {
                        senderId: req.userId,
                        receiverId: req.params.userId
                    },
                    {
                        senderId: req.params.userId,
                        receiverId: req.userId
                    }
                ]
            }
        });
        res.json({
            messages: mssages
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
