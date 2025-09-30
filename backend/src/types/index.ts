import z from 'zod';

export const SignUpZodSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8)
});

export const SignInZodSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
})

export const CreateWorkspaceSchema = z.object({
    name: z.string().min(3),
    about: z.string().optional(),
    isPrivate: z.boolean().optional()
});

export const GetWorkspaceSchema = z.object({
    workspaceId: z.string()
});

export const JoinChannelURLSchema = z.object({
    workspaceId: z.string(),
    channelId: z.string()
});

export const DeleteWorkspaceSchema = z.object({
    workspaceId: z.string()
});

export const CreateChannelSchem = z.object({
    workspaceId: z.string(),
    name: z.string().min(3),
    isPrivate: z.boolean().optional(),
});

export const DeleteChannelSchema = z.object({
    channelId: z.string(),
});