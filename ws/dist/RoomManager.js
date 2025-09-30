"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.rooms = new Map();
    }
    static getInstance() {
        if (!RoomManager.instance) {
            this.instance = new RoomManager();
        }
        return this.instance;
    }
    addUser(user) {
        var _a;
        if (!this.rooms.has(user.roomId)) {
            this.rooms.set(user.roomId, [user]);
            return;
        }
        this.rooms.set(user.roomId, [...((_a = this.rooms.get(user.roomId)) !== null && _a !== void 0 ? _a : []), user]);
    }
    removeUser(user) {
        var _a, _b;
        if (!this.rooms.has(user.roomId)) {
            return;
        }
        this.rooms.set(user.roomId, (_b = (_a = this.rooms.get(user.roomId)) === null || _a === void 0 ? void 0 : _a.filter((u) => u.id !== user.id)) !== null && _b !== void 0 ? _b : []);
    }
    broadcast(user, message) {
        var _a;
        if (!this.rooms.has(user.roomId)) {
            return;
        }
        (_a = this.rooms.get(user.roomId)) === null || _a === void 0 ? void 0 : _a.forEach((u) => {
            if (u.id !== user.id) {
                u.send(message);
            }
        });
    }
    getUsers(workspaceId, userId) {
        const users = [];
        for (const [key, value] of this.rooms) {
            for (const user of value) {
                if (user.workspaceId === workspaceId && user.userId !== userId) {
                    users.push({ userId: user.userId, username: user.username });
                }
            }
        }
        return users;
    }
}
exports.RoomManager = RoomManager;
