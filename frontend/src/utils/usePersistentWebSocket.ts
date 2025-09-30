type WebSocketCallbackMessage = (msg: any) => void;

interface PersistentWebSocketClientParams {
  wsUrl?: string;
  type: "group" | "user";
  workspaceId: string;
  channelId?: string;
  receiverId?: string;
  onMessage?: WebSocketCallbackMessage;
}

export class PersistentWebSocketClient {
    private static instance: PersistentWebSocketClient | null = null;

    private ws: WebSocket | null = null;
    private reconnectTimer: number | null = null;
    private wsUrl: string;
    private reconnectInterval: number = 2000;
    private workspaceId: string;
    private channelId?: string;
    private receiverId?: string;
    private type: "group" | "user";

    public onMessage?: WebSocketCallbackMessage;

    private constructor(
        wsUrl: string = import.meta.env.VITE_WS_URL,
        type: "group" | "user",
        workspaceId: string,
        channelId: string,
        receiverId: string,
        onMessage?: WebSocketCallbackMessage
    ) {
        this.wsUrl = wsUrl;
        this.type = type;
        this.workspaceId = workspaceId;
        this.channelId = channelId;
        this.receiverId = receiverId;
        this.onMessage = onMessage;
        this.connect();
    }

    public static getInstance(params: PersistentWebSocketClientParams): PersistentWebSocketClient {
        const {
            wsUrl = import.meta.env.VITE_WS_URL,
            type,
            workspaceId,
            channelId,
            receiverId,
            onMessage
        } = params;
        
        if(!this.instance) {
            this.instance = new PersistentWebSocketClient(
                wsUrl,
                type,
                workspaceId!,
                channelId!,
                receiverId!,
                onMessage
            );
        }
        return this.instance;
    }

    private connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.warn("WebSocket is already open — skipping duplicate connect()");
            return;
        }

        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
            this.ws.close();
            this.ws.close();
        }

        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
            console.log("connected");
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }

            if(this.type === "group"){
                this.send("group-join", { channelId: this.channelId, workspaceId: this.workspaceId });
            } else if(this.type === "user") {
                this.send("direct-message-join", { workspaceId: this.workspaceId, receiverId: this.receiverId });
            }

        };

        this.ws.onclose = () => {
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
            }
            this.reconnectTimer = window.setTimeout(() => this.connect(), this.reconnectInterval);
        };

        this.ws.onerror = () => {
            if (this.ws && this.ws.readyState !== WebSocket.CLOSING && this.ws.readyState !== WebSocket.CLOSED) {
                this.ws.close();
            }
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if(this.onMessage) {
                this.onMessage(data);
            }
        }
    }

    public send(type: string, payload: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }));
        }
    }

    public changeChannelWorkspace(workspaceId: string, channelId: string) {
        this.workspaceId = workspaceId;
        this.channelId = channelId;
        this.type = "group";
        this.close();
        this.connect();
    }

    public changeReceiver(workspaceId: string, receiverId: string) {
        this.workspaceId = workspaceId;
        this.receiverId = receiverId;
        this.type = "user";
        this.close();
        this.connect();
    }

    public close() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "leave" }));
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}
