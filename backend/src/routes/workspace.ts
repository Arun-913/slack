import { Router, Request, Response } from "express";
import { CreateWorkspaceSchema, DeleteWorkspaceSchema } from "../types";
import { prismaClient } from "../db";
import { userMiddleware } from "../middleware/user";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const workspaceRouter = Router();
workspaceRouter.use(userMiddleware);

// create workspace
workspaceRouter.post('/', async (req: Request, res: Response) => {
    const body = req.body;
    const parsedData = CreateWorkspaceSchema.safeParse(body);
    
    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return
    }

    const workspaceExists = await prismaClient.workspace.findFirst({
        where: {
            name: parsedData.data.name,
            createdBy: req.userId
        }
    });

    if(workspaceExists) {
        res.status(403).json({ message: "Workspace with same already exists" });
        return
    }

    const workspace = await prismaClient.workspace.create({
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
});

// get all workspaces created and joined workspaces by single user
workspaceRouter.get('/', async (req: Request, res: Response) => {
    const workspaces = await prismaClient.workspace.findMany({
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
    
    let email: string | undefined = undefined;
    const workspacesWithCreatorDetails = await Promise.all(workspaces.map(async (workspace) => {
        const [creator, channel] = await Promise.all([
            await prismaClient.user.findUnique({
                where: { id: workspace.createdBy },
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            }),    
            await prismaClient.channel.findFirst({
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
        const { users, ...workspaceWithoutUsers } = workspace;
        email = !email ? creator?.email : email;

        return {
            ...workspaceWithoutUsers,
            members: membersCount,
            channelId: channel?.id,
            createdByUser: creator,
        };
    }));

    res.status(200).json({ workspaces: workspacesWithCreatorDetails, email });
});

// get workspace created by yourself
workspaceRouter.get('/self', async (req: Request, res: Response) => {
    const workspaces = await prismaClient.workspace.findMany({
        where: {
            createdBy: req.userId || ""
        }
    });

    res.json({ workspaces });
});

// get joined workspaces
workspaceRouter.get('/joined', async (req: Request, res: Response) => {
    const workspaces = await prismaClient.workspace.findMany({
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
});

// delete workspace
workspaceRouter.delete('/', async (req: Request, res: Response) => {
    const body = req.body;
    const parsedData = DeleteWorkspaceSchema.safeParse(body);

    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
        return
    }

    const workspaceExists = await prismaClient.workspace.findFirst({
        where: {
            id: parsedData.data.workspaceId
        }
    });

    if(workspaceExists?.createdBy !== req.userId) {
        res.status(403).json({ message: "You don't have permission to delete this workspace" });
        return
    }

    prismaClient.$transaction(async (tx) => {
        try {
            await tx.channel.deleteMany({
                where: {
                    workspaceId: parsedData.data.workspaceId
                }
            });
    
            await tx.workspace.delete({
                where: {
                    id: parsedData.data.workspaceId
                }
            });
    
            res.json({ message: "Workspace deleted successfully" });
    
        } catch (error) { 
            console.error("Transaction failed:", error);
    
            if (error instanceof PrismaClientKnownRequestError) {
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
            } else {
                res.status(500).json({
                    message: "An unexpected error occurred",
                    error: (error as Error).message,
                });
            }
        }
    });    
});