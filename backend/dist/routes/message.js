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
exports.messageRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const user_1 = require("../middleware/user");
exports.messageRouter = (0, express_1.Router)();
exports.messageRouter.use(user_1.userMiddleware);
exports.messageRouter.get('/groupMessage/:channelId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const channelId = req.params.channelId;
        const { page, limit } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(10, parseInt(limit));
        if (!channelId) {
            res.status(403).json({ message: "Channel doesn't exist" });
            return;
        }
        const channel = yield db_1.prismaClient.channel.findUnique({
            where: {
                id: channelId
            },
            include: {
                members: true
            }
        });
        if (!channel) {
            res.status(403).json({ message: "Channel doesn't exist" });
            return;
        }
        if (!channel.members.some(member => member.id === req.userId)) {
            res.status(403).json({ message: "You don't have permission to access this channel" });
            return;
        }
        const messages = yield db_1.prismaClient.message.findMany({
            where: {
                channelId: channelId
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            include: {
                user: {
                    select: {
                        username: true,
                    }
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                username: true,
                            }
                        },
                    }
                }
            }
        });
        if (pageNum === 1) {
            const allRelevantMessages = yield db_1.prismaClient.message.findMany({
                where: { channelId, parentId: null },
                select: { id: true }
            });
            yield Promise.all(allRelevantMessages.map((m) => db_1.prismaClient.messageStatus.upsert({
                where: { messageId_userId: { messageId: m.id, userId: req.userId } },
                update: { status: 'Seen', updatedAt: new Date() },
                create: { messageId: m.id, userId: req.userId, status: 'Seen', updatedAt: new Date() }
            })));
            const totalMembers = yield db_1.prismaClient.user.count({
                where: { channels: { some: { id: channelId } } }
            });
            const totalSeen = yield Promise.all(allRelevantMessages.map((m) => db_1.prismaClient.messageStatus.count({
                where: { messageId: m.id, status: "Seen" }
            }).then(count => ({ messageId: m.id, count }))));
            yield Promise.all(totalSeen
                .filter(item => item.count >= totalMembers)
                .map(item => db_1.prismaClient.message.update({
                where: { id: item.messageId },
                data: { allSeen: true }
            })));
        }
        res.json({ messages });
    }
    catch (error) {
        console.log(error);
        res.json({ message: error.message });
        return;
    }
}));
exports.messageRouter.get('/directMessage/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.params.userId || req.userId === req.params.userId) {
            res.status(400).json({ message: "Invalid user id" });
            return;
        }
        const { page, limit } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(10, parseInt(limit));
        const messages = yield db_1.prismaClient.directMessage.findMany({
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
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            include: {
                sender: {
                    select: {
                        username: true,
                    }
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        sender: {
                            select: {
                                username: true,
                            }
                        },
                    }
                }
            }
        });
        if (pageNum === 1) {
            yield Promise.all(messages.map((message, index) => {
                if (message.receiverId === req.userId) {
                    messages[index].seen = true;
                    messages[index].status = 'Seen';
                    return db_1.prismaClient.directMessage.update({
                        where: {
                            id: message.id
                        },
                        data: {
                            status: 'Seen',
                            seen: true,
                            updatedAt: new Date(),
                        }
                    });
                }
                return false;
            }).filter(Boolean));
        }
        res.json({
            messages: messages
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
