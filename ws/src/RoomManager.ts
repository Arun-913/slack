import { OutGoingMessage } from './types';
import { User } from './User';

export class RoomManager {
    rooms: Map<string, User[]> = new Map();
    static instance: RoomManager;

    constructor() {
        this.rooms = new Map();
    }

    static getInstance() {
        if(!RoomManager.instance) {
            this.instance = new RoomManager();
        }
        return this.instance;
    }

    public addUser(user: User){
        if(!this.rooms.has(user.roomId!)) {
            this.rooms.set(user.roomId!, [user])
            return;
        }
        this.rooms.set(user.roomId!,[...(this.rooms.get(user.roomId!) ?? []), user]);
    }

    public removeUser(user: User) {
        if(!this.rooms.has(user.roomId!)) {
            return;
        }
        this.rooms.set(user.roomId!, this.rooms.get(user.roomId!)?.filter((u) => u.id !== user.id) ?? []);
    }

    public broadcast(user: User, message: OutGoingMessage){
        if(!this.rooms.has(user.roomId!)) {
            return;
        }
        this.rooms.get(user.roomId!)?.forEach((u: User) => {
            if(u.id !== user.id) {
                u.send(message);
            }
        });
    }

    public getUsers(workspaceId: string, userId: string) {
        const users = [];
        for(const [key, value] of this.rooms) {
            for(const user of value) {
                if(user.workspaceId === workspaceId && user.userId !== userId) {
                    users.push({userId: user.userId, username: user.username});
                }
            }
        }
        return users;
    }
}