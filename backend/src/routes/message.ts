import { Router, Request, Response } from "express";
import { prismaClient } from "../db";
import { userMiddleware } from "../middleware/user";

export const messageRouter = Router();

messageRouter.use(userMiddleware);

messageRouter.get('/groupMessage/:channelId', async(req: Request, res: Response) => {
    try {
        const channelId = req.params.channelId;
        const { page, limit } = req.query as { page: string, limit: string };
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(10, parseInt(limit));

        if(!channelId) {
            res.status(403).json({ message: "Channel doesn't exist" });
            return
        }
        
        const channel = await prismaClient.channel.findUnique({
            where: {
                id: channelId
            },
            include: {
                members: true
            }
        });
        
        if(!channel) {
            res.status(403).json({ message: "Channel doesn't exist" });
            return
        }

        if(!channel.members.some(member => member.id === req.userId)) {
            res.status(403).json({ message: "You don't have permission to access this channel" });
            return
        }

        const messages = await prismaClient.message.findMany({
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

        if(pageNum === 1) {
            const allRelevantMessages = await prismaClient.message.findMany({
                where: { channelId, parentId: null },
                select: { id: true }
            });
    
            await Promise.all(
                allRelevantMessages.map((m) =>
                    prismaClient.messageStatus.upsert({
                        where: { messageId_userId: { messageId: m.id, userId: req.userId! } },
                        update: { status: 'Seen', updatedAt: new Date() },
                        create: { messageId: m.id, userId: req.userId!, status: 'Seen', updatedAt: new Date() }
                    })
                )
            );
    
            const totalMembers = await prismaClient.user.count({
                where: { channels: { some: { id: channelId } } }
            });
    
            const totalSeen = await Promise.all(
                allRelevantMessages.map((m) =>
                    prismaClient.messageStatus.count({
                        where: { messageId: m.id, status: "Seen" }
                    }).then(count => ({ messageId: m.id, count }))
                )
            );
            
            await Promise.all(
                totalSeen
                    .filter(item => item.count >= totalMembers)
                    .map(item =>
                    prismaClient.message.update({
                        where: { id: item.messageId },
                        data: { allSeen: true }
                    })
                )
            );
        }

        res.json({ messages });
    } catch (error: any) {
        console.log(error)
        res.json({ message: error.message });
        return;
    }
});

messageRouter.get('/directMessage/:userId', async(req: Request, res: Response) => {
    try {
        if(!req.params.userId || req.userId === req.params.userId) {
            res.status(400).json({ message: "Invalid user id" });
            return
        }

        const { page, limit } = req.query as { page: string, limit: string };
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(10, parseInt(limit));

        const messages = await prismaClient.directMessage.findMany({
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

        if(pageNum === 1) {
            await Promise.all(
                messages.map((message, index) => {
                    if(message.receiverId === req.userId) {
                        messages[index].seen = true;
                        messages[index].status = 'Seen';
                        return prismaClient.directMessage.update({
                            where: {
                                id: message.id
                            },
                            data: {
                                status: 'Seen',
                                seen: true,
                                updatedAt: new Date(),
                            }
                        })
                    }
                    return false;
                }).filter(Boolean)
            )
        }

        res.json({
            messages: messages
        })
    } catch (error:any) {
        res.status(400).json({ message: error.message });
    }
})