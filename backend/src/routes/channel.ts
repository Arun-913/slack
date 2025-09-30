import { Router, Request, Response } from "express";
import { CreateChannelSchem, DeleteChannelSchema, GetWorkspaceSchema, JoinChannelURLSchema } from "../types";
import { prismaClient } from "../db";
import { userMiddleware } from "../middleware/user";
import jwt from 'jsonwebtoken';
import { FrontendURL, JWT_JOIN_KEY, JWT_WS } from "../config";

export const channelRouter = Router();

channelRouter.use(userMiddleware);

// create channel (only admin can create)
channelRouter.post('/', async (req: Request, res: Response) => {
    const body = req.body;
    const parsedData = CreateChannelSchem.safeParse(body);

    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return
    }

    const workspaceExists = await prismaClient.workspace.findFirst({
        where: {
            id: parsedData.data.workspaceId,
            createdBy: req.userId
        }
    });

    if(!workspaceExists) {
        res.status(403).json({ message: "Workspace doesn't exist" });
        return
    }

    const channel = await prismaClient.channel.create({
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
});

// get channel by workspace id 
channelRouter.get('/', async (req: Request, res: Response) => {
    try {
        const parsedData = GetWorkspaceSchema.safeParse(req.query);
        
        if (!parsedData.success) {
            res.status(411).json({
                message: "Incorrect query inputs"
            });
            return;
        }
    
        const [channels, workspace] = await Promise.all([
            await prismaClient.channel.findMany({
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
            await prismaClient.workspace.findUnique({
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
                        await prismaClient.$transaction(async (tx) => {
                            await tx.workspace.update({
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
                    
                            await tx.channel.update({
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
                        });
                    } catch (error) {
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
    
        const isPresent = new Set<string>();
        let members = channels.flatMap((item) => {
            return item.members.map(member => ({
                ...member,
                status: "offline"
            }));
        }).filter((member) => {
            if (isPresent.has(member.id) || member.id === req.userId) return false;
            isPresent.add(member.id);
            return true;
        });
    
        members = await Promise.all(
            members.map(async (member) => {
                const count = await prismaClient.directMessage.count({
                    where: {
                        senderId: member.id, receiverId: req.userId,
                        seen: false
                    }
                });
                return { ...member, unseen: count };
            })
        );
        
        res.json({ channels: availableChannel, workspace, members });
    } catch (error: any) {
        console.log(error);
        res.json({ message: error.message });
    }

});

// get single channle with joined users
channelRouter.get('/:channelId', async (req, res) => {
    try {
        let channelId = req.params.channelId;
    
        const channel = await prismaClient.channel.findUnique({
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
    
        if(!channel) {
            res.status(403).json({ message: "Channel doesn't exist" });
            return
        }
    
        //if channel is public
        if(channel.isPrivate === false) {
            // if user is not in channel then add it (for public channel only)
            if(!channel.members.some(member => member.id === req.userId)) {
                await  prismaClient.$transaction(async (tx) => {
                    try {
                        await tx.workspace.update({
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
            
                        await tx.channel.update({
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
                        return
                    } catch (error) {
                        console.error("Transaction failed:", error);
                        
                        res.status(500).json({ message: "Internal Server Error" });
                        return
                    }
                });
            }
            res.json({ members: channel.members });
            return
        }
    
        // if channel is private
        if(!channel.members.some(member => member.id === req.userId)) {
            res.status(403).json({ message: "You don't have permission to access this channel" });
            return
        }
    
        res.json({ members: channel.members });
    } catch (error: any) {
        console.log(error);
        res.json({ message: error.message });
    }
});

channelRouter.post('/join/createUrl', async (req, res) => {
    try {
        const parsedData = JoinChannelURLSchema.safeParse(req.body);
    
        if (!parsedData.success) {
            res.status(411).json({
                message: "Incorrect inputs"
            });
            return
        }
    
        const workspace = await prismaClient.workspace.findFirst({
            where: {
                id: parsedData.data.workspaceId
            }
        });
    
        if(!workspace) {
            res.status(403).json({ message: "Workspace doesn't exist" });
            return
        }
    
        if(workspace.createdBy !== req.userId) {
            res.status(403).json({ message: "You don't have permission to create url for another to join" });
            return
        }
    
        const token = jwt.sign({
            channelId: parsedData.data.channelId,
            userId: req.userId
        }, JWT_JOIN_KEY, {
            expiresIn: '24h'   
        });

        if(typeof token !== "string") {
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
    
        let urlData = await prismaClient.url.upsert({
            where: {
                token: token as string
            },
            update: {

            },
            create: { token }
        });
    
        res.json({
            url: `${FrontendURL}/join/${urlData.id}`
        })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// join channel by workspace id
channelRouter.post('/join/:id', async (req: Request, res: Response) => {
    const urlId = req.params.id;

    try {
        const urlData = await prismaClient.url.findUnique({
            where: {
                id: urlId
            }
        });

        if(!urlData) {
            res.status(403).json({ message: "Invalid Url" });
            return
        }

        const token = urlData.token;
        console.log("token: ", token)
        const decoded = jwt.verify(token, JWT_JOIN_KEY) as { channelId: string, userId: string };

        const channel = await prismaClient.channel.findFirst({
            where: {
                id: decoded.channelId
            },
            include: {
                members: true,
            },
        });

        if(!channel) {
            res.status(403).json({ message: "Channel doesn't exist" });
            return
        }

        if(!channel.members.some(member => member.id === req.userId)) {
            await  prismaClient.$transaction(async (tx) => {
                try {
                    await tx.workspace.update({
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
        
                    await tx.channel.update({
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
                    return
                } catch (error) {
                    console.error("Transaction failed:", error);
                    
                    res.status(500).json({ message: "Internal Server Error" });
                    return
                }
            });
        } else {
            // todo: instead of retruning json object, redirect to channel in frontend
            res.json({ message: "Channel Joined Successfully" });
            return
        }
    } catch (error:any) {
        console.log(error);
        res.status(411).json({ message: error.message });
        return;
    }
});

channelRouter.delete('/', async (req: Request, res: Response) => {
    const body = req.body;
    const parsedData = DeleteChannelSchema.safeParse(body);

    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return
    }
    
    const channelExists = await prismaClient.channel.findFirst({
        where: {
            id: parsedData.data.channelId
        },
        include: {
            workspace: true
        }
    });

    if(!channelExists) {
        res.status(403).json({ message: "Channel doesn't exist" });
        return
    }

    if(channelExists.workspace.createdBy !== req.userId) {
        res.status(403).json({ message: "You don't have permission to delete this channel" });
        return
    }

    await prismaClient.channel.delete({
        where: {
            id: parsedData.data.channelId
        }
    });

    res.json({ message: "Channel deleted successfully" });
});
