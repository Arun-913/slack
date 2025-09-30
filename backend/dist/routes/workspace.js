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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceRouter = void 0;
const express_1 = require("express");
const types_1 = require("../types");
const db_1 = require("../db");
const user_1 = require("../middleware/user");
const library_1 = require("@prisma/client/runtime/library");
exports.workspaceRouter = (0, express_1.Router)();
exports.workspaceRouter.use(user_1.userMiddleware);
// create workspace
exports.workspaceRouter.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const parsedData = types_1.CreateWorkspaceSchema.safeParse(body);
    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return;
    }
    const workspaceExists = yield db_1.prismaClient.workspace.findFirst({
        where: {
            name: parsedData.data.name,
            createdBy: req.userId
        }
    });
    if (workspaceExists) {
        res.status(403).json({ message: "Workspace with same already exists" });
        return;
    }
    const workspace = yield db_1.prismaClient.workspace.create({
        data: {
            name: parsedData.data.name,
            isPrivate: parsedData.data.isPrivate,
            createdBy: req.userId || "",
            about: parsedData.data.about || "",
            users: {
                connect: [
                    {
                        id: req.userId || ""
                    }
                ]
            }
        }
    });
    res.status(201).json({
        message: "Workspace created successfully",
        workspace
    });
}));
// get all workspaces created and joined workspaces by single user
exports.workspaceRouter.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const workspaces = yield db_1.prismaClient.workspace.findMany({
        where: {
            users: {
                some: {
                    id: req.userId || ""
                }
            }
        },
        include: {
            users: true
        }
    });
    let email = undefined;
    const workspacesWithCreatorDetails = yield Promise.all(workspaces.map((workspace) => __awaiter(void 0, void 0, void 0, function* () {
        const [creator, channel] = yield Promise.all([
            yield db_1.prismaClient.user.findUnique({
                where: { id: workspace.createdBy },
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            }),
            yield db_1.prismaClient.channel.findFirst({
                where: {
                    workspaceId: workspace.id,
                    name: "General"
                },
                include: {
                    members: true
                }
            })
        ]);
        const membersCount = workspace.users.length;
        const { users } = workspace, workspaceWithoutUsers = __rest(workspace, ["users"]);
        email = !email ? creator === null || creator === void 0 ? void 0 : creator.email : email;
        return Object.assign(Object.assign({}, workspaceWithoutUsers), { members: membersCount, channelId: channel === null || channel === void 0 ? void 0 : channel.id, createdByUser: creator });
    })));
    res.status(200).json({ workspaces: workspacesWithCreatorDetails, email });
}));
// get workspace created by yourself
exports.workspaceRouter.get('/self', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const workspaces = yield db_1.prismaClient.workspace.findMany({
        where: {
            createdBy: req.userId || ""
        }
    });
    res.json({ workspaces });
}));
// get joined workspaces
exports.workspaceRouter.get('/joined', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const workspaces = yield db_1.prismaClient.workspace.findMany({
        where: {
            createdBy: {
                not: req.userId || ""
            },
            users: {
                some: {
                    id: req.userId || ""
                }
            }
        }
    });
    res.json({ workspaces });
}));
// delete workspace
exports.workspaceRouter.delete('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const parsedData = types_1.DeleteWorkspaceSchema.safeParse(body);
    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return;
    }
    const workspaceExists = yield db_1.prismaClient.workspace.findFirst({
        where: {
            id: parsedData.data.workspaceId
        }
    });
    if ((workspaceExists === null || workspaceExists === void 0 ? void 0 : workspaceExists.createdBy) !== req.userId) {
        res.status(403).json({ message: "You don't have permission to delete this workspace" });
        return;
    }
    db_1.prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield tx.channel.deleteMany({
                where: {
                    workspaceId: parsedData.data.workspaceId
                }
            });
            yield tx.workspace.delete({
                where: {
                    id: parsedData.data.workspaceId
                }
            });
            res.json({ message: "Workspace deleted successfully" });
        }
        catch (error) {
            console.error("Transaction failed:", error);
            if (error instanceof library_1.PrismaClientKnownRequestError) {
                switch (error.code) {
                    case 'P2002':
                        res.status(400).json({ message: "A unique constraint error occurred", error: error.message });
                        break;
                    case 'P2025':
                        res.status(404).json({ message: "Workspace not found", error: error.message });
                        break;
                    default:
                        res.status(500).json({
                            message: "An error occurred during the transaction",
                            error: error.message,
                        });
                }
            }
            else {
                res.status(500).json({
                    message: "An unexpected error occurred",
                    error: error.message,
                });
            }
        }
    }));
}));
