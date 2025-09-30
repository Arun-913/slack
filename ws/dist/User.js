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
exports.User = void 0;
require("dotenv/config");
const ws_1 = require("ws");
const db_1 = require("./db");
const RoomManager_1 = require("./RoomManager");
function getRandomString(length) {
    const character = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += character.charAt(Math.floor(Math.random() * character.length));
    }
    return result;
}
class User {
    constructor(ws, userId, username) {
        this.id = getRandomString(10);
        this.ws = ws;
        this.userId = userId;
        this.username = username;
        this.initHandlers();
    }
    setVariablesForGroup(workspaceId, channelId) {
        this.type = "group";
        this.workspaceId = workspaceId;
        this.channelId = channelId;
        this.roomId = channelId;
        this.receiverId = undefined;
    }
    setVariablesForDM(workspaceId, receiverId) {
        this.type = "user";
        this.workspaceId = workspaceId;
        this.receiverId = receiverId;
        this.roomId = [this.userId, this.receiverId].sort().join("");
        this.channelId = undefined;
    }
    initHandlers() {
        this.ws.on("message", (data) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            try {
                const parsedData = JSON.parse(data.toString());
                console.log(parsedData);
                switch (parsedData.type) {
                    case "group-join":
                        try {
                            const { workspaceId, channelId } = parsedData.payload;
                            const workspace = yield db_1.prismaClient.workspace.findUnique({
                                where: {
                                    id: workspaceId
                                },
                            });
                            if (!workspace) {
                                throw new Error("Invalid token");
                            }
                            // this.workspaceId = workspaceId;
                            const channel = yield db_1.prismaClient.channel.findUnique({
                                where: {
                                    id: channelId
                                },
                            });
                            if (!channel) {
                                throw new Error("Invalid token");
                            }
                            // this.channelId = channelId;
                            this.setVariablesForGroup(workspaceId, channelId);
                            RoomManager_1.RoomManager.getInstance().addUser(this);
                            RoomManager_1.RoomManager.getInstance().broadcast(this, {
                                type: "user-joined",
                                payload: {
                                    userId: this.userId,
                                    username: this.username
                                }
                            });
                            setTimeout(() => {
                                if (this.ws.readyState === ws_1.WebSocket.OPEN) {
                                    this.ws.send(JSON.stringify({
                                        type: "active-users",
                                        payload: {
                                            users: RoomManager_1.RoomManager.getInstance().getUsers(this.workspaceId, this.userId)
                                        }
                                    }));
                                }
                            }, 200);
                        }
                        catch (error) {
                            this.ws.send(JSON.stringify({
                                type: "invalid-input",
                                payload: {
                                    message: "Invalid token"
                                }
                            }));
                        }
                        break;
                    case "group-message":
                        if (!('message' in parsedData.payload)) {
                            this.ws.send(JSON.stringify({
                                type: "invalid-input",
                                payload: {
                                    message: "Invalid Input"
                                }
                            }));
                            return;
                        }
                        const message = yield db_1.prismaClient.message.create({
                            data: {
                                content: parsedData.payload.message,
                                userId: this.userId,
                                channelId: this.channelId,
                                parentId: parsedData.payload.parentId,
                                allDelivered: true,
                                createdAt: new Date(parsedData.payload.time),
                            },
                            select: {
                                id: true,
                                content: true,
                                parentId: true,
                                parent: {
                                    select: {
                                        userId: true,
                                        content: true,
                                        user: {
                                            select: {
                                                username: true,
                                            },
                                        },
                                    },
                                },
                            }
                        });
                        Promise.all([
                            yield db_1.prismaClient.messageStatus.upsert({
                                where: {
                                    messageId_userId: {
                                        messageId: message.id,
                                        userId: this.userId,
                                    }
                                },
                                update: {
                                    status: "Seen",
                                    updatedAt: new Date(),
                                },
                                create: {
                                    messageId: message.id,
                                    userId: this.userId,
                                    status: "Seen",
                                }
                            }),
                            // @ts-ignore
                            RoomManager_1.RoomManager.getInstance().broadcast(this, {
                                type: "group-message",
                                payload: {
                                    userId: this.userId,
                                    username: this.username,
                                    messageId: message.id,
                                    message: parsedData.payload.message,
                                    parentId: parsedData.payload.parentId,
                                    parentContent: (_a = message.parent) === null || _a === void 0 ? void 0 : _a.content,
                                    parentUser: (_c = (_b = message.parent) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.username,
                                    previousId: parsedData.payload.id,
                                    time: parsedData.payload.time
                                }
                            }),
                            this.ws.send(JSON.stringify({
                                type: "message-id",
                                payload: {
                                    messageId: message.id,
                                    previousId: parsedData.payload.id
                                }
                            }))
                        ]);
                        break;
                    case "group-message-seen-ack":
                        yield db_1.prismaClient.messageStatus.upsert({
                            where: {
                                messageId_userId: {
                                    messageId: parsedData.payload.messageId,
                                    userId: this.userId,
                                }
                            },
                            update: {
                                status: "Seen",
                                updatedAt: new Date(),
                            },
                            create: {
                                messageId: parsedData.payload.messageId,
                                userId: this.userId,
                                status: "Seen",
                            }
                        });
                        const [totalMembersCount, seenCount] = yield Promise.all([
                            db_1.prismaClient.user.count({
                                where: { channels: { some: { id: this.channelId } } }
                            }),
                            db_1.prismaClient.messageStatus.count({
                                where: { messageId: parsedData.payload.messageId, status: "Seen" }
                            }),
                        ]);
                        if (seenCount >= totalMembersCount - 1) {
                            yield Promise.all([
                                db_1.prismaClient.message.update({
                                    where: { id: parsedData.payload.messageId },
                                    data: { allSeen: true },
                                }),
                                RoomManager_1.RoomManager.getInstance().broadcast(this, {
                                    type: "message-status-chg",
                                    payload: {
                                        previousId: parsedData.payload.previousId,
                                        messageId: parsedData.payload.messageId,
                                        status: "Seen"
                                    }
                                })
                            ]);
                        }
                        break;
                    case "direct-message-join":
                        try {
                            const { workspaceId, receiverId } = parsedData.payload;
                            // this.workspaceId = workspaceId;
                            const user = yield db_1.prismaClient.user.findUnique({
                                where: {
                                    id: receiverId
                                },
                            });
                            if (!user) {
                                throw new Error("Invalid Input");
                            }
                            // this.receiverId = receiverId;
                            // this.roomId = [this.userId, this.receiverId].sort().join("")
                            this.setVariablesForDM(workspaceId, receiverId);
                            RoomManager_1.RoomManager.getInstance().addUser(this);
                            RoomManager_1.RoomManager.getInstance().broadcast(this, {
                                type: "user-joined",
                                payload: {
                                    userId: this.userId,
                                    username: this.username
                                }
                            });
                            setTimeout(() => {
                                if (this.ws.readyState === ws_1.WebSocket.OPEN) {
                                    this.ws.send(JSON.stringify({
                                        type: "active-users",
                                        payload: {
                                            users: RoomManager_1.RoomManager.getInstance().getUsers(this.workspaceId, this.userId)
                                        }
                                    }));
                                }
                            }, 200);
                        }
                        catch (error) {
                            this.ws.send(JSON.stringify({
                                type: "invalid-input",
                                payload: {
                                    message: "Invalid token"
                                }
                            }));
                        }
                        break;
                    case "direct-message":
                        const dmMessage = yield db_1.prismaClient.directMessage.create({
                            data: {
                                content: parsedData.payload.message,
                                senderId: this.userId,
                                receiverId: this.receiverId,
                                parentId: parsedData.payload.parentId,
                                seen: false,
                                createdAt: new Date(parsedData.payload.time),
                            },
                            select: {
                                id: true,
                                content: true,
                                parentId: true,
                                parent: {
                                    select: {
                                        senderId: true,
                                        content: true,
                                        sender: {
                                            select: {
                                                username: true,
                                            },
                                        },
                                    },
                                }
                            }
                        });
                        RoomManager_1.RoomManager.getInstance().broadcast(this, {
                            type: "direct-message",
                            payload: {
                                receiverId: this.receiverId,
                                userId: this.userId,
                                username: this.username,
                                messageId: dmMessage.id,
                                message: parsedData.payload.message,
                                parentId: parsedData.payload.parentId,
                                parentContent: (_d = dmMessage.parent) === null || _d === void 0 ? void 0 : _d.content,
                                parentUser: (_f = (_e = dmMessage.parent) === null || _e === void 0 ? void 0 : _e.sender) === null || _f === void 0 ? void 0 : _f.username,
                                previousId: parsedData.payload.id,
                                time: parsedData.payload.time
                            }
                        }),
                            this.ws.send(JSON.stringify({
                                type: "message-id",
                                payload: {
                                    messageId: dmMessage.id,
                                    previousId: parsedData.payload.id
                                }
                            }));
                        break;
                    case "direct-message-seen-ack":
                        yield db_1.prismaClient.directMessage.update({
                            where: {
                                id: parsedData.payload.messageId
                            },
                            data: {
                                status: "Seen",
                                updatedAt: new Date(),
                            },
                        });
                        RoomManager_1.RoomManager.getInstance().broadcast(this, {
                            type: "message-status-chg",
                            payload: {
                                previousId: parsedData.payload.previousId,
                                messageId: parsedData.payload.messageId,
                                status: "Seen"
                            }
                        });
                        break;
                    case "leave":
                        this.destroy();
                        break;
                }
            }
            catch (error) {
                console.log(error);
            }
        }));
        this.ws.on('close', () => {
            this.destroy();
        });
    }
    destroy() {
        RoomManager_1.RoomManager.getInstance().removeUser(this);
        RoomManager_1.RoomManager.getInstance().broadcast(this, {
            type: "user-left",
            payload: {
                userId: this.userId,
                username: this.username
            }
        });
        this.ws.close();
    }
    send(payload) {
        this.ws.send(JSON.stringify(payload));
    }
}
exports.User = User;
