import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { PersistentWebSocketClient } from "../utils/usePersistentWebSocket";
import axios from "axios";
import { useStableState } from "../hooks/useStableState";
import { MoreVertical } from "lucide-react";
import { LoginStatus } from "../utils/loginStatus";
import { useNavigate } from "react-router-dom";

interface ChatBoxProps {
    id: number,
    user: string,
    avatar: string,
    time: string,
    text: string,
    status: string,
    isMe: boolean,
    parentId?: string
    parentContent?: string;
    parentUser?: string;
    onReply?: (data: any) => void,
    onParentClick?: (parentId: string) => void
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
}

type ScrollBottom = {
    type: "First Render",
    length: number
} | {
    type: "Send Message"
    length: number
} | {
    type: "Pagination"
    length: number
}

interface ChatContainerProps {
    wsClientRef: PersistentWebSocketClient | null;
    chatId: string;
    type: string;
    isFetchingMessage: boolean;
    setIsFetchingMessage: React.Dispatch<React.SetStateAction<boolean>>;
    onWsMessage: (data: any) => void;
}

export interface ChatContainerRef {
    handleFetchMessage: (isPagination: boolean) => void;
}

const ChatBox = forwardRef<HTMLDivElement, ChatBoxProps>(
    ({id, user, avatar, time, text, status, isMe, parentId, parentContent, parentUser, onParentClick, onReply}, ref,) => {
        const [menuOpen, setMenuOpen] = useStableState<boolean>(false);
        const menuRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => {
            if (!menuOpen) return;
            const handleClick = (event: MouseEvent) => {
                // @ts-ignore
                if (menuRef.current && !menuRef.current.contains(event.target)) {
                    setMenuOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClick);
            return () => document.removeEventListener("mousedown", handleClick);
        }, [menuOpen]);

        const handleReply = () => {
            setMenuOpen(false);
            onReply?.({ id, user, avatar, time, text, status, isMe, parentId });  
        }

        const handleCopy = () => {
            setMenuOpen(false);
            navigator.clipboard.writeText(text);
        }

        return (
            <div
                ref={ref}
                key={id}
                className={`relative flex items-start gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
            >

                {isMe && (
                    <div className="flex flex-col items-center justify-center mr-1 relative">
                        <button
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
                            onClick={() => setMenuOpen((open) => !open)}
                        >
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                        {menuOpen && (
                            <div
                                className="absolute right-7 top-0 z-10 min-w-[100px] bg-white border rounded-md shadow-md py-1 flex flex-col"
                                ref={menuRef}
                            >
                                <button
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                    onClick={handleReply}
                                >Reply</button>
                                <button
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                    onClick={handleCopy}
                                >Copy</button>
                            </div>
                        )}
                    </div>
                )}
                {!isMe && (
                    <img
                        className="w-8 h-8 rounded-full"
                        src={avatar}
                        alt={`${user} avatar`}
                    />
                )}
                <div
                    className={`flex flex-col max-w-xs p-4 rounded-xl leading-1.5 ${isMe
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-900 rounded-bl-none dark:bg-gray-700 dark:text-white"
                        }`}
                >
                    {parentId && parentContent && (
                        <div
                            onClick={() => onParentClick && parentId && onParentClick(parentId)}
                            className={`cursor-pointer select-none px-3 py-1 mb-1 rounded max-w-xs truncate hover:bg-gray-300 dark:hover:bg-gray-600 text-black ${isMe ? "bg-gray-200 dark:bg-gray-700" : "bg-blue-500 dark:bg-blue-700"}`}
                            title={`Replyed by ${parentUser}`}
                        >
                            <span className="font-semibold text-sm">{parentUser}: </span>
                            <span className="text-sm truncate">{parentContent}</span>
                        </div>
                    )}
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-semibold">
                            {isMe ? "You" : user}
                        </span>
                        <span className={`text-xs text-gray-500 ${isMe ? "text-white" : "dark:text-gray-400"}`}>
                            {time}
                        </span>
                    </div>
                    <p className="text-sm">{text}</p>
                    {isMe && <span className="text-xs text-gray-400 mt-1">{status}</span>}
                </div>
                {!isMe && (
                    <div className="flex flex-col items-center justify-center ml-1 relative">
                        <button
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
                            onClick={() => setMenuOpen((open) => !open)}
                        >
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                        {menuOpen && (
                            <div
                                className="absolute left-7 top-0 z-10 min-w-[100px] bg-white border rounded-md shadow-md py-1 flex flex-col"
                                ref={menuRef}
                            >
                                <button
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                    onClick={handleReply}
                                >Reply</button>
                                <button
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                    onClick={handleCopy}
                                >Copy</button>
                            </div>
                        )}
                    </div>
                )}
                {isMe && (
                    <img
                        className="w-8 h-8 rounded-full"
                        src={avatar}
                        alt="Your avatar"
                    />
                )}
            </div>
        );
    }
);

export const ChatContainer = forwardRef<ChatContainerRef, ChatContainerProps>(({ wsClientRef, chatId, type, isFetchingMessage, setIsFetchingMessage, onWsMessage }, ref) => {
    const [messages, setMessages] = useStableState<ChatBoxProps[]>([]);
    const [replyTo, setReplyTo] = useStableState<ChatBoxProps | null>(null);
    const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const pagination = useRef<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0
    });
    const chatRef = useRef<HTMLDivElement | null>(null);
    const isFirstRender = useRef(true);
    const navigate = useNavigate();
    const currentScrollPosition = useRef<ScrollBottom>({ type: "First Render", length: 0 });
    const isFetchingMessageRef = useRef(isFetchingMessage);

    const handleFetchMessage = async(isPagination: boolean) => {
        try {
            if(!isPagination) {
                pagination.current = {
                    page: 1,
                    limit: 10,
                    total: 0
                }
                isFirstRender.current = false;
            }
    
            let url = type === "user" ? `${import.meta.env.VITE_BACKEND_URL}/api/message/directMessage/${chatId}?page=${pagination.current.page}&limit=${pagination.current.limit}` : `${import.meta.env.VITE_BACKEND_URL}/api/message/groupMessage/${chatId}?page=${pagination.current.page}&limit=${pagination.current.limit}`;
            let response = await axios.get(url,
                {
                    withCredentials: true
                }
            );
            if(type === "group") {
                const temp = response.data.messages.reverse().map((item: any): ChatBoxProps => ({
                    id: item.id,
                    user: item.user.username,
                    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
                    time: new Date(item.createdAt).toLocaleTimeString(),
                    text: item.content,
                    status: item.allSeen ? "Seen" : "Delivered",
                    isMe: localStorage.getItem("userId") === item.userId,
                    parentId: item.parentId,
                    parentContent: item.parent?.content,
                    parentUser: item.parent?.user?.username
                }))
                if(temp.length === 0) return;
                if(isPagination){
                    currentScrollPosition.current = {
                        type: "Pagination",
                        length: temp.length
                    }
                    setMessages(prev => [...temp, ...prev]);
                } else {
                    setMessages(temp);
                }
                pagination.current = ({
                    page: pagination.current.page + 1,
                    limit: pagination.current.limit,
                    total: response.data.total
                });
            } else if(type === "user") {
                const temp = response.data.messages.reverse().map((item: any): ChatBoxProps => ({
                    id: item.id,
                    user: item.sender.username,
                    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
                    time: new Date(item.createdAt).toLocaleTimeString(),
                    text: item.content,
                    status: item.seen ? "Seen" : "Delivered",
                    isMe: localStorage.getItem("userId") === item.senderId,
                    parentId: item.parentId,
                    parentContent: item.parent?.content,
                    parentUser: item.parent?.sender?.username
                }))
                if(temp.length === 0) return;
                if(isPagination){
                    setMessages(prev => [...prev, ...temp]);
                } else {
                    setMessages(temp);
                }
                pagination.current = ({
                    page: pagination.current.page + 1,
                    limit: pagination.current.limit,
                    total: response.data.total
                });
            }
            setIsFetchingMessage(false);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        isFetchingMessageRef.current = isFetchingMessage;
    },[isFetchingMessage])

    useEffect(() => {
        // console.log("before: ", isFirstRender.current)
        isFirstRender.current = true;
        // console.log("after: ", isFirstRender.current)
    }, [chatId])

    const handleScroll = () => {
        if (!chatRef.current || isFirstRender.current || isFetchingMessageRef.current) return;
        if (chatRef.current.scrollTop === 0) {
            handleFetchMessage(true);
        }
    };

    const scrollToMessage = (messageId: string) => {
        const element = messageRefs.current[messageId];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring', 'ring-blue-400');
            setTimeout(() => {
                element.classList.remove('ring', 'ring-blue-400');
            }, 2000);
        }
    };

    const handleSend = (e: any) => {
        e.preventDefault();
        if(e.target.message.value.trim() === '') return;
        const len = messages.length + 1;
        const time = new Date().getTime();
        currentScrollPosition.current = { type: "Send Message", length: currentScrollPosition.current.length + 1 };
        setMessages([...messages, { 
            id: len + 1, 
            user: "You", 
            avatar: "https://randomuser.me/api/portraits/men/45.jpg", 
            time: new Date(time).toLocaleTimeString(), 
            text: e.target.message.value, 
            status: "Delivered", 
            isMe: true,
            parentId: replyTo ? (replyTo.id).toString() : undefined,
            parentContent: replyTo ? replyTo.text : undefined,
            parentUser: replyTo ? replyTo.user : undefined
        }]);
        wsClientRef?.send(type === "group" ? "group-message" : "direct-message", { 
            message: e.target.message.value, 
            id: len + 1,
            parentId: replyTo ? replyTo.id : undefined,
            time: time
        });
        e.target.message.value = '';
        setReplyTo(null);
    };

    useEffect(() => {
        if(messages.length > 0) {
            let length = 0;
            if(currentScrollPosition.current.type === "First Render" || currentScrollPosition.current.type === "Send Message") {
                length = messages.length - 1;
            } else {
                length = currentScrollPosition.current.length - 1;
            }

            const lastMsgId = messages[length].id;
            const lastRef = messageRefs.current[lastMsgId];
            lastRef?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            currentScrollPosition.current = { type: currentScrollPosition.current.type, length: messages.length };
        }
    }, [currentScrollPosition.current, messages]);

    useImperativeHandle(ref, () => ({
        handleFetchMessage
    }));

    useEffect(() => {
        if(!wsClientRef) return;

        const handleMessage = (data: any) => {
            console.log('websocket: ', data);
            if(data.type === "error"){
                LoginStatus().then(() => {}).catch(() => navigate('/signin'));
            }

            if((data.type === "group-message" || data.type === "direct-message") && data.payload) {
                const msg: ChatBoxProps = {
                    id: data.payload.messageId,
                    user: data.payload.username,
                    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
                    time: new Date(data.payload.time).toLocaleTimeString(),
                    text: data.payload.message,
                    status: "Delivered",
                    isMe: localStorage.getItem("userId") === data.payload.userId,
                    parentId: data.payload.parentId,
                    parentContent: data.payload.parentContent,
                    parentUser: data.payload.parentUser
                }

                // this case shouldn't be there but to be on safer side
                if(data.type === "direct-message" && chatId === data.payload.receiverId) return;
                setMessages([...messages, msg]);

                if(localStorage.getItem("userId") !== data.payload.userId) {
                    wsClientRef?.send(type === "group" ? "group-message-seen-ack" : "direct-message-seen-ack", { messageId: data.payload.messageId, previousId: data.payload.previousId });
                }
            } else if(data.type === "message-id" && data.payload){
                setMessages(messages.map((item) => item.id === data.payload.previousId ? {...item, id: data.payload.messageId} : item));
            } else if(data.type === "message-status-chg" && data.payload){
                setMessages(messages.map((item) => (item.id === data.payload.messageId || item.id === data.payload.previousId) ? {...item, status: data.payload.status} : item));
            } else if(data.type === "user-joined" || data.type === "active-users" || data.type === "user-left") {
                onWsMessage(data);
            }
        }

        wsClientRef.onMessage = handleMessage;
    }, [wsClientRef, messages.length]);

    useEffect(() => {
        const cur = chatRef.current;
        if(!cur) return;
        cur.addEventListener('scroll', handleScroll);
        return () => cur.removeEventListener('scroll', handleScroll);
    },[chatRef.current])

    return (
        <div className="flex flex-col h-screen">
            <div className="border-b px-6 py-4">
                {/* Header content */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold"># channel-1</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">A</span>
                        <button className="p-1 rounded hover:bg-gray-100">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-2" ref={chatRef}>
                {messages.map((msg: ChatBoxProps) => {
                    return (
                        <ChatBox
                            key={msg.id}
                            {...msg}
                            ref={(el) => { messageRefs.current[msg.id] = el; }}
                            onReply={(msgInfo: ChatBoxProps) => setReplyTo(msgInfo)}
                            onParentClick={scrollToMessage}
                        />
                    );
                })}
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 mt-8">
                {replyTo && (
                    <div className="flex items-center bg-blue-50 border-l-4 border-blue-400 px-3 py-2 mb-2 relative">
                        <span className="font-semibold text-blue-700 mr-2">{replyTo.isMe ? "You" : replyTo.user}</span>
                        <span className="text-gray-600 text-sm truncate">{replyTo.text}</span>
                        <button
                            className="ml-auto text-gray-400 hover:text-gray-700 p-1 absolute right-1 top-1"
                            onClick={() => setReplyTo(null)}
                            aria-label="Cancel reply"
                        >✕</button>
                    </div>
                )}
                <form
                    className="flex items-center gap-2"
                    onSubmit={handleSend}
                >

                    <input
                        name="message"
                        type="text"
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 dark:text-white"
                        placeholder="Message #channel-1"
                        autoComplete="false"
                    />
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
})
