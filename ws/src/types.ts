export type WebSocketPayload = {
    type: 'group-join',
    payload: {
        workspaceId: string,
        channelId: string
    }
} | {
    type: 'group-message',
    payload: {
        message: string,
        parentId: string | null,
        id: string,
        time: number
    }
} | {
    type: 'leave'
} | {
    type: 'group-message-seen-ack',
    payload: {
        messageId: string,
        previousId: string
    }
} | {
    type: 'direct-message-join',
    payload: {
        workspaceId: string,
        receiverId: string,
    }
} | {
    type: "direct-message",
    payload: {
        receiverId: string,
        message: string,
        parentId: string | null,
        id: string,
        time: number
    }
} | {
    type: 'direct-message-seen-ack',
    payload: {
        messageId: string,
        previousId: string
    }
};

export type OutGoingMessage = {
    type: "user-joined",
    payload: {
        userId: string,
        username: string,
    }
} | {
    type: "user-left",
    payload: {
        userId: string,
        username: string,
    }
} | {
    type: "group-message",
    payload: {
        userId: string,
        username: string,
        messageId: string,
        message: string,
        parentId: string | null,
        parentContent: string | null,
        parentUser: string | null,
        previousId: string | null,
        time: number
    }
} | {
    type: "message-id",
    payload: {
        messageId: string,
    }
} | {
    type: "message-status-chg",
    payload: {
        previousId: string,
        messageId: string,
        status: string
    }
} |  {
    type: "direct-message",
    payload: {
        receiverId: string,
        userId: string,
        username: string,
        messageId: string,
        message: string,
        parentId: string | null,
        parentContent: string | null | undefined,
        parentUser: string | null | undefined,
        previousId: string | null,
        time: number
    }
};