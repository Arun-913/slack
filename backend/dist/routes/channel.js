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
exports.channelRouter = void 0;
const express_1 = require("express");
const types_1 = require("../types");
const db_1 = require("../db");
const user_1 = require("../middleware/user");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
exports.channelRouter = (0, express_1.Router)();
exports.channelRouter.use(user_1.userMiddleware);
// create channel (only admin can create)
exports.channelRouter.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const parsedData = types_1.CreateChannelSchem.safeParse(body);
    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return;
    }
    const workspaceExists = yield db_1.prismaClient.workspace.findFirst({
        where: {
            id: parsedData.data.workspaceId,
            createdBy: req.userId
        }
    });
    if (!workspaceExists) {
        res.status(403).json({ message: "Workspace doesn't exist" });
        return;
    }
    const channel = yield db_1.prismaClient.channel.create({
        data: {
            name: parsedData.data.name,
            isPrivate: workspaceExists.isPrivate == true ? true : parsedData.data.isPrivate,
            workspaceId: parsedData.data.workspaceId,
            members: {
                connect: [
                    {
                        id: req.userId
                    }
                ]
            }
        }
    });
    res.status(201).json({
        message: "Channel created successfully",
        channel
    });
}));
// get channel by workspace id 
exports.channelRouter.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedData = types_1.GetWorkspaceSchema.safeParse(req.query);
        if (!parsedData.success) {
            res.status(411).json({
                message: "Incorrect query inputs"
            });
            return;
        }
        const [channels, workspace] = yield Promise.all([
            yield db_1.prismaClient.channel.findMany({
                where: {
                    workspaceId: parsedData.data.workspaceId
                },
                include: {
                    members: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                },
            }),
            yield db_1.prismaClient.workspace.findUnique({
                where: {
                    id: parsedData.data.workspaceId
                }
            })
        ]);
        const availableChannel = [];
        for (const channel of channels) {
            if (channel.isPrivate === false) {
                // If user is not in channel then add it (for public channel only)
                if (!channel.members.some(member => member.id === req.userId)) {
                    try {
                        yield db_1.prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                            yield tx.workspace.update({
                                where: {
                                    id: parsedData.data.workspaceId
                                },
                                data: {
                                    users: {
                                        connect: [
                                            {
                                                id: req.userId
                                            }
                                        ]
                                    }
                                }
                            });
                            yield tx.channel.update({
                                where: {
                                    id: channel.id
                                },
                                data: {
                                    members: {
                                        connect: [
                                            {
                                                id: req.userId
                                            }
                                        ]
                                    }
                                }
                            });
                        }));
                    }
                    catch (error) {
                        console.error("Transaction failed:", error);
                        res.status(500).json({ message: "Internal Server Error" });
                        return;
                    }
                }
                availableChannel.push(channel);
            }
            // If channel is private and user is a member, add to available channels
            if (channel.isPrivate == true && channel.members.some(member => member.id === req.userId)) {
                availableChannel.push(channel);
            }
        }
        const isPresent = new Set();
        let members = channels.flatMap((item) => {
            return item.members.map(member => (Object.assign(Object.assign({}, member), { status: "offline" })));
        }).filter((member) => {
            if (isPresent.has(member.id) || member.id === req.userId)
                return false;
            isPresent.add(member.id);
            return true;
        });
        members = yield Promise.all(members.map((member) => __awaiter(void 0, void 0, void 0, function* () {
            const count = yield db_1.prismaClient.directMessage.count({
                where: {
                    senderId: member.id, receiverId: req.userId,
                    seen: false
                }
            });
            return Object.assign(Object.assign({}, member), { unseen: count });
        })));
        res.json({ channels: availableChannel, workspace, members });
    }
    catch (error) {
        console.log(error);
        res.json({ message: error.message });
    }
}));
// get single channle with joined users
exports.channelRouter.get('/:channelId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let channelId = req.params.channelId;
        const channel = yield db_1.prismaClient.channel.findUnique({
            where: {
                id: channelId
            },
            include: {
                members: {
                    select: {
                        id: true,
                        username: true
                    }
                },
            },
        });
        if (!channel) {
            res.status(403).json({ message: "Channel doesn't exist" });
            return;
        }
        //if channel is public
        if (channel.isPrivate === false) {
            // if user is not in channel then add it (for public channel only)
            if (!channel.members.some(member => member.id === req.userId)) {
                yield db_1.prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                    try {
                        yield tx.workspace.update({
                            where: {
                                id: channel.workspaceId
                            },
                            data: {
                                users: {
                                    connect: [
                                        {
                                            id: req.userId
                                        }
                                    ]
                                }
                            }
                        });
                        yield tx.channel.update({
                            where: {
                                id: channel.id
                            },
                            data: {
                                members: {
                                    connect: [
                                        {
                                            id: req.userId
                                        }
                                    ]
                                }
                            }
                        });
                        res.json({ members: channel.members });
                        return;
                    }
                    catch (error) {
                        console.error("Transaction failed:", error);
                        res.status(500).json({ message: "Internal Server Error" });
                        return;
                    }
                }));
            }
            res.json({ members: channel.members });
            return;
        }
        // if channel is private
        if (!channel.members.some(member => member.id === req.userId)) {
            res.status(403).json({ message: "You don't have permission to access this channel" });
            return;
        }
        res.json({ members: channel.members });
    }
    catch (error) {
        console.log(error);
        res.json({ message: error.message });
    }
}));
exports.channelRouter.post('/join/createUrl', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedData = types_1.JoinChannelURLSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(411).json({
                message: "Incorrect inputs"
            });
            return;
        }
        const workspace = yield db_1.prismaClient.workspace.findFirst({
            where: {
                id: parsedData.data.workspaceId
            }
        });
        if (!workspace) {
            res.status(403).json({ message: "Workspace doesn't exist" });
            return;
        }
        if (workspace.createdBy !== req.userId) {
            res.status(403).json({ message: "You don't have permission to create url for another to join" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({
            channelId: parsedData.data.channelId,
            userId: req.userId
        }, config_1.JWT_JOIN_KEY, {
            expiresIn: '24h'
        });
        if (typeof token !== "string") {
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
        let urlData = yield db_1.prismaClient.url.upsert({
            where: {
                token: token
            },
            update: {},
            create: { token }
        });
        res.json({
            url: `${config_1.FrontendURL}/join/${urlData.id}`
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// join channel by workspace id
exports.channelRouter.post('/join/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const urlId = req.params.id;
    try {
        const urlData = yield db_1.prismaClient.url.findUnique({
            where: {
                id: urlId
            }
        });
        if (!urlData) {
            res.status(403).json({ message: "Invalid Url" });
            return;
        }
        const token = urlData.token;
        console.log("token: ", token);
        const decoded = jsonwebtoken_1.default.verify(token, config_1.JWT_JOIN_KEY);
        const channel = yield db_1.prismaClient.channel.findFirst({
            where: {
                id: decoded.channelId
            },
            include: {
                members: true,
            },
        });
        if (!channel) {
            res.status(403).json({ message: "Channel doesn't exist" });
            return;
        }
        if (!channel.members.some(member => member.id === req.userId)) {
            yield db_1.prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield tx.workspace.update({
                        where: {
                            id: channel.workspaceId
                        },
                        data: {
                            users: {
                                connect: [
                                    {
                                        id: req.userId
                                    }
                                ]
                            }
                        }
                    });
                    yield tx.channel.update({
                        where: {
                            id: channel.id
                        },
                        data: {
                            members: {
                                connect: [
                                    {
                                        id: req.userId
                                    }
                                ]
                            }
                        }
                    });
                    res.json({ channel });
                    return;
                }
                catch (error) {
                    console.error("Transaction failed:", error);
                    res.status(500).json({ message: "Internal Server Error" });
                    return;
                }
            }));
        }
        else {
            // todo: instead of retruning json object, redirect to channel in frontend
            res.json({ message: "Channel Joined Successfully" });
            return;
        }
    }
    catch (error) {
        console.log(error);
        res.status(411).json({ message: error.message });
        return;
    }
}));
exports.channelRouter.delete('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const parsedData = types_1.DeleteChannelSchema.safeParse(body);
    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return;
    }
    const channelExists = yield db_1.prismaClient.channel.findFirst({
        where: {
            id: parsedData.data.channelId
        },
        include: {
            workspace: true
        }
    });
    if (!channelExists) {
        res.status(403).json({ message: "Channel doesn't exist" });
        return;
    }
    if (channelExists.workspace.createdBy !== req.userId) {
        res.status(403).json({ message: "You don't have permission to delete this channel" });
        return;
    }
    yield db_1.prismaClient.channel.delete({
        where: {
            id: parsedData.data.channelId
        }
    });
    res.json({ message: "Channel deleted successfully" });
}));
