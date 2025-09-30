"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteChannelSchema = exports.CreateChannelSchem = exports.DeleteWorkspaceSchema = exports.JoinChannelURLSchema = exports.GetWorkspaceSchema = exports.CreateWorkspaceSchema = exports.SignInZodSchema = exports.SignUpZodSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.SignUpZodSchema = zod_1.default.object({
    username: zod_1.default.string().min(3),
    email: zod_1.default.string().email(),
    password: zod_1.default.string().min(8)
});
exports.SignInZodSchema = zod_1.default.object({
    email: zod_1.default.string().email(),
    password: zod_1.default.string().min(8)
});
exports.CreateWorkspaceSchema = zod_1.default.object({
    name: zod_1.default.string().min(3),
    about: zod_1.default.string().optional(),
    isPrivate: zod_1.default.boolean().optional()
});
exports.GetWorkspaceSchema = zod_1.default.object({
    workspaceId: zod_1.default.string()
});
exports.JoinChannelURLSchema = zod_1.default.object({
    workspaceId: zod_1.default.string(),
    channelId: zod_1.default.string()
});
exports.DeleteWorkspaceSchema = zod_1.default.object({
    workspaceId: zod_1.default.string()
});
exports.CreateChannelSchem = zod_1.default.object({
    workspaceId: zod_1.default.string(),
    name: zod_1.default.string().min(3),
    isPrivate: zod_1.default.boolean().optional(),
});
exports.DeleteChannelSchema = zod_1.default.object({
    channelId: zod_1.default.string(),
});
