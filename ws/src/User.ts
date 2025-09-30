import 'dotenv/config';
import { WebSocket } from "ws";
import { prismaClient } from './db';
import { WebSocketPayload, OutGoingMessage } from './types';
import { RoomManager } from './RoomManager';

function getRandomString(length: number) {
    const character = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for(let i=0; i<length; i++) {
        result += character.charAt(Math.floor(Math.random() * character.length));
    }
    return result;
}

export class User {
    public id: string;
    public userId: string;
    public username: string;
    public workspaceId?: string;
    public channelId?: string;
    public receiverId?: string;
    public roomId?: string;
    public type?: "user" | "group";
    private ws: WebSocket;

    constructor(ws: WebSocket, userId: string, username: string) {
        this.id = getRandomString(10);
        this.ws = ws;
        this.userId = userId;
        this.username = username;
        this.initHandlers();
    }

    private setVariablesForGroup(workspaceId: string, channelId: string) {
        this.type = "group";
        this.workspaceId = workspaceId;
        this.channelId = channelId;
        this.roomId = channelId;
        this.receiverId = undefined;
    }

    private setVariablesForDM(workspaceId: string, receiverId: string) {
        this.type = "user";
        this.workspaceId = workspaceId;
        this.receiverId = receiverId;
        this.roomId = [this.userId, this.receiverId].sort().join("")
        this.channelId = undefined;
    }

    initHandlers() {
        this.ws.on("message", async (data) => {
            try {
                const parsedData: WebSocketPayload = JSON.parse(data.toString());
                console.log(parsedData);

                switch (parsedData.type) {
                    case "group-join":
                        try {
                            const { workspaceId, channelId } = parsedData.payload;
                            const workspace = await prismaClient.workspace.findUnique({
                                where: {
                                    id: workspaceId
                                },
                            });
                            if(!workspace) {
                                throw new Error("Invalid token");
                            }
                            
                            const channel = await prismaClient.channel.findUnique({
                                where: {
                                    id: channelId
                                },
                            });
                            if(!channel) {
                                throw new Error("Invalid token");
                            }

                            this.setVariablesForGroup(workspaceId, channelId)
                            
                            RoomManager.getInstance().addUser(this);
                            RoomManager.getInstance().broadcast(this, {
                                type: "user-joined",
                                payload: {
                                    userId: this.userId,
                                    username: this.username
                                }
                            });
                            setTimeout(() => {
                                if (this.ws.readyState === WebSocket.OPEN) {
                                    this.ws.send(JSON.stringify({
                                        type: "active-users",
                                        payload: {
                                            users: RoomManager.getInstance().getUsers(this.workspaceId!, this.userId)
                                        }
                                    }));
                                }
                            }, 200);
                        } catch (error) {
                            this.ws.send(JSON.stringify({
                                type: "invalid-input",
                                payload: {
                                    message: "Invalid token"
                                }
                            }));
                        }
                        break;
                    case "group-message":
                        if(!('message' in parsedData.payload)) {
                            this.ws.send(JSON.stringify({
                                type: "invalid-input",
                                payload: {
                                    message: "Invalid Input"
                                }
                            }));
                            return
                        }

                        const message = await prismaClient.message.create({
                            data: {
                                content: parsedData.payload.message,
                                userId: this.userId!,
                                channelId: this.channelId!,
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
                            await prismaClient.messageStatus.upsert({
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
                            RoomManager.getInstance().broadcast(this,{
                                type: "group-message",
                                payload: {
                                    userId: this.userId!,
                                    username: this.username!,
                                    messageId: message.id,
                                    message: parsedData.payload.message,
                                    parentId: parsedData.payload.parentId,
                                    parentContent: message.parent?.content,
                                    parentUser: message.parent?.user?.username,
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
                        await prismaClient.messageStatus.upsert({
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

                        const [totalMembersCount, seenCount] = await Promise.all([
                            prismaClient.user.count({
                                where: { channels: { some: { id: this.channelId! } } }
                            }),
                            prismaClient.messageStatus.count({
                                where: { messageId: parsedData.payload.messageId, status: "Seen" }
                            }),
                        ]);

                        if(seenCount >= totalMembersCount -1) {
                            await Promise.all([
                                prismaClient.message.update({
                                    where: { id: parsedData.payload.messageId },
                                    data: { allSeen: true },
                                }),
                                RoomManager.getInstance().broadcast(this, {
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
                            
                            const user = await prismaClient.user.findUnique({
                                where: {
                                    id: receiverId
                                },
                            });
                            if(!user) {
                                throw new Error("Invalid Input");
                            }

                            this.setVariablesForDM(workspaceId, receiverId);

                            RoomManager.getInstance().addUser(this);
                            RoomManager.getInstance().broadcast(this, {
                                type: "user-joined",
                                payload: {
                                    userId: this.userId,
                                    username: this.username
                                }
                            });
                            setTimeout(() => {
                                if (this.ws.readyState === WebSocket.OPEN) {
                                    this.ws.send(JSON.stringify({
                                        type: "active-users",
                                        payload: {
                                            users: RoomManager.getInstance().getUsers(this.workspaceId!, this.userId)
                                        }
                                    }));
                                }
                            }, 200);
                        } catch (error) {
                            this.ws.send(JSON.stringify({
                                type: "invalid-input",
                                payload: {
                                    message: "Invalid token"
                                }
                            }));
                        }
                        break;
                    case "direct-message":  
                        const dmMessage = await prismaClient.directMessage.create({
                            data: {
                                content: parsedData.payload.message,
                                senderId: this.userId!,
                                receiverId: this.receiverId!,
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

                        RoomManager.getInstance().broadcast(this, {
                            type: "direct-message",
                            payload: {
                                receiverId: this.receiverId!,
                                userId: this.userId!,
                                username: this.username!,
                                messageId: dmMessage.id,
                                message: parsedData.payload.message,
                                parentId: parsedData.payload.parentId,
                                parentContent: dmMessage.parent?.content,
                                parentUser: dmMessage.parent?.sender?.username,
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
                        }))
                        break;
                    case "direct-message-seen-ack":
                        await prismaClient.directMessage.update({
                            where: {
                                id: parsedData.payload.messageId
                            },
                            data: {
                                status: "Seen",
                                updatedAt: new Date(),
                            },
                        });

                        RoomManager.getInstance().broadcast(this, {
                            type: "message-status-chg",
                            payload: {
                                previousId: parsedData.payload.previousId,
                                messageId: parsedData.payload.messageId,
                                status: "Seen"
                            }
                        })

                        break;
                    case "leave":
                        this.destroy();
                        break;
                }
            } catch (error) {
                console.log(error);
            }
        })

        this.ws.on('close', () => {
            this.destroy();
        })
    }

    destroy() {
        RoomManager.getInstance().removeUser(this);
        RoomManager.getInstance().broadcast(this, {
            type: "user-left",
            payload: {
                userId: this.userId!,
                username: this.username!
            }
        });
        this.ws.close();
    }

    send(payload: OutGoingMessage) {
        this.ws.send(JSON.stringify(payload));
    }
}