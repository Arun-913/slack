import { useEffect, useRef } from "react"
import { Home } from "../components/Icons/Home"
import { More } from "../components/Icons/More"
import { WorkspaceNameIcon } from "../components/Icons/WorkspaceNameIcon"
import { useNavigate, useParams } from "react-router-dom"
import { HashIcon } from "../HeroIcons/HashIcon"
import { ChevronDownIcon } from "../HeroIcons/ChevronDownIcon"
import { PlusIcon } from "../HeroIcons/PlusIcon"
import { ChevronRightIcon } from "../HeroIcons/ChevronRightIcon"
import { LoginStatus } from "../utils/loginStatus"
import axios, { AxiosError } from "axios"
import { toast, ToastContainer } from "react-toastify"
import { X } from "lucide-react"
import { Input } from "../components/ui/Input"
import { Button } from "../components/ui/Button"
import { ChatContainer, ChatContainerRef } from "../components/ChatContainer"
import { PersistentWebSocketClient } from "../utils/usePersistentWebSocket"
import { useStableState } from "../hooks/useStableState"

interface CreateChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ChannelInterface {
    id: string,
    name: string,
    isPrivate: boolean,
    workspaceId: string,
    createdAt: string,
    members: Array<MemberInterface>
}

interface MemberInterface {
    id: string,
    username: string,
    status: "online" | "offline"
    unseen: number
}

interface FieldInterface {
    id: string,
    name: string,
    type: "group" | "user",
    status?: "online" | "offline"
}

const CreateChannelModal = ({ isOpen, onClose }: CreateChannelModalProps) => {
    const [step, setStep] = useStableState(1);
    const [channelName, setChannelName] = useStableState("");
    const [isPrivate, setIsPrivate] = useStableState<boolean>(false);
    const { workspaceId } = useParams();

    const handleCreateChannel = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/channel`, {
                workspaceId,
                name: channelName,
                isPrivate,
            }, {
                withCredentials: true
            });

            setStep(1);
            setChannelName("");
            setIsPrivate(false);
            onClose();
            toast.success("Channel created successfully");
            window.location.reload();
        } catch (error: AxiosError | any) {
            toast.error(error.response.data.message);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={onClose}>
            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Create a channel</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {step === 1 ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="channelName" className="block font-medium">
                                Name
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">#</span>
                                <Input
                                    id="channelName"
                                    className="pl-7"
                                    placeholder="Enter channel name"
                                    value={channelName}
                                    onChange={(e: any) => setChannelName(e.target.value)}
                                />
                            </div>
                            <p className="text-sm text-gray-600">
                                Channels are where conversations happen around a topic. Use a name that is easy to find and understand.
                            </p>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <span className="text-sm text-gray-600">Step 1 of 2</span>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
                                if (!channelName) {
                                    toast.error("Please enter a channel name");
                                    return;
                                }
                                setStep(2)
                            }}>
                                Next
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-lg font-medium">Visibility</p>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="radio"
                                    name="isPrivate"
                                    value="public"
                                    checked={isPrivate === false}
                                    onChange={() => setIsPrivate(false)}
                                />
                                <span>
                                    <strong>Public</strong> - Anyone in <span className="font-semibold">Temp Workspace</span>
                                </span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input
                                    type="radio"
                                    name="isPrivate"
                                    value="private"
                                    checked={isPrivate === true}
                                    onChange={() => setIsPrivate(true)}
                                />
                                <span>
                                    <strong>Private</strong> - Only specific people
                                    <br />
                                </span>
                            </label>
                            <label className="flex items-center space-x-3">
                                {/* add space to the left with input field */}
                                <input type="radio" className="invisible" />
                                <span className="text-sm text-gray-600">Can only be viewed or joined by invitation</span>
                            </label>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                Back
                            </Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateChannel}>Create</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const WorkspaceMaster = () => {
    const navigate = useNavigate();
    const { workspaceId, chatId } = useParams();
    const wsClientRef = useRef<PersistentWebSocketClient | null>(null);

    const [workspace, setWorkspace] = useStableState<any>('');
    const [selectedTab, setSelectedTab] = useStableState<string>('home');
    const [channels, setChannels] = useStableState<ChannelInterface[]>([]);
    const [selectedField, setSelectedField] = useStableState<FieldInterface | null>(null);
    const [isChannelsOpen, setIsChannelsOpen] = useStableState<boolean>(false);
    const [loading, setLoading] = useStableState(true);
    const [isModalOpen, setIsModalOpen] = useStableState(false);
    const [isDMOpen, setisDMOpen] = useStableState<boolean>(false);
    const [members, setMembers] = useStableState<MemberInterface[]>([]);
    const [type, setType] = useStableState<string>('group');
    const [isFetchingMessage, setIsFetchingMessage] = useStableState<boolean>(false);
    const chatContainerRef = useRef<ChatContainerRef>(null);
    const isFirstRender = useRef(true);
    const isWsEventTriggered = useRef(false);
    const selectedFieldRef = useRef(selectedField);

    const handleChannelAndDMClick = (field: FieldInterface) => {
        setisDMOpen(false);
        setIsChannelsOpen(false);
        if(field.type === "user") {
            setMembers((prevMembers) => 
                prevMembers.map((member) =>
                    member.id === field.id
                        ? { ...member, unseen: 0 }
                        : member
                )
            );
        }
        setSelectedField(field);
        navigate(`/workspace/${workspaceId}/${field.id}`);
        setType(field.type);
    }

    const handleChatEvent = (data: any) => {
        const currentSelected = selectedFieldRef.current; 
        isWsEventTriggered.current = true;
        
        if(data.type === "user-joined" || data.type === "user-left") {
            const {userId} = data.payload;
            const status = data.type === "user-joined" ? "online" : "offline";
            setMembers((prevMembers) => 
                prevMembers.map((member) =>
                    member.id === userId
                        ? { ...member, status: status }
                        : member
                )
            );
            if(currentSelected?.type === "user" && currentSelected?.id === userId) {
                setSelectedField({
                    ...currentSelected,
                    status: status
                })
            }
        } else if(data.type === "active-users") {
            const {users} = data.payload;
            setMembers((prevMembers) => 
                prevMembers.map((member) =>
                    member.id === users.find((user: any) => user.userId === member.id)?.userId
                        ? { ...member, status: "online" }
                        : member
                )
            );
            if(currentSelected?.type === "user" && currentSelected?.id === users.find((user: any) => user.userId === currentSelected.id)?.userId) {
                setSelectedField({
                    ...currentSelected,
                    status: "online"
                })
            }
        }
    };

    useEffect(() => {
        selectedFieldRef.current = selectedField;
        if(!wsClientRef?.current && selectedField) {
            wsClientRef.current = PersistentWebSocketClient.getInstance({
                wsUrl: import.meta.env.VITE_WS_URL,
                type: selectedField.type,
                workspaceId: workspaceId!,
                channelId: selectedField.type === "group" ? selectedField.id : "",
                receiverId: selectedField.type === "user" ? selectedField.id : "",
            });
        } else if(wsClientRef && selectedField && !isWsEventTriggered.current) {
            if(selectedField.type === 'group') {
                wsClientRef.current?.changeChannelWorkspace(workspaceId!, selectedField.id);
            } else if(selectedField?.type === 'user') {
                wsClientRef.current?.changeReceiver(workspaceId!, selectedField.id);
            }
        }
        isWsEventTriggered.current = false;
    },[selectedField])

    useEffect(() => {
        (async () => {
            try {
                const channelField = channels.find((item: ChannelInterface) => item.id === chatId);
                const memberField = members.find((item: MemberInterface) => item.id === chatId);

                if (channelField) {
                    setSelectedField({
                        ...channelField,
                        type: "group"
                    });
                    setType("group");
                } else if(memberField) {
                    setSelectedField({
                        ...memberField,
                        name: memberField.username,
                        type: "user"
                    });
                    setType("user");
                }
                setIsFetchingMessage(true);
                chatContainerRef.current?.handleFetchMessage(false);
            } catch (error: AxiosError | any) {
                console.log(error);
                toast.error(error.message);
            }
        })();
    }, [workspaceId, chatId]);

    useEffect(() => {
        (async () => {
            try {
                await LoginStatus();
                setLoading(false);
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/channel?workspaceId=${workspaceId}`, {
                    withCredentials: true
                });

                const { channels, workspace, members } = response.data;
                if(workspace) {
                    setWorkspace(workspace)
                }
                if(channels.length){
                    setChannels(channels);
                    const channelField = channels.find((item: ChannelInterface) => item.id === chatId);
                    if(channelField) {
                        setSelectedField({
                            ...channels.find((item: ChannelInterface) => item.id === chatId),
                            type: "group"
                        });
                        setType("group");
                    }
                }

                setMembers(members);
                const memberField = members.find((item: MemberInterface) => item.id === chatId);
                if(memberField) {
                    setSelectedField({
                        ...members.find((item: MemberInterface) => item.id === chatId),
                        name: memberField.username,
                        type: "user"
                    })
                    setType("user");
                }

                // if(!wsClientRef.current) {
                //     const interval = setInterval(() => {
                //         console.log("fiell: ", selectedField)
                //         if(selectedField) {
                //             wsClientRef.current = PersistentWebSocketClient.getInstance({
                //                 wsUrl: import.meta.env.VITE_WS_URL,
                //                 type: selectedField?.type!,
                //                 workspaceId: workspaceId!,
                //                 channelId: selectedField?.type === "group" ? selectedField?.id : "",
                //                 receiverId: selectedField?.type === "user" ? selectedField?.id : "",
                //             });
                //             clearInterval(interval);
                //         }
                //     }, 2000);
                // }

                // return () => {
                //     wsClientRef.current?.close();
                //     wsClientRef.current = null;
                // };
            } catch (error: any) {
                console.log(error);
                toast.error(error.response?.data?.message, {
                    onClose: () => navigate('/signin')
                });
            }           
        })();
    },[])

    useEffect(() => {
        if (chatContainerRef.current && isFirstRender.current) {
            isFirstRender.current = false;
            chatContainerRef.current.handleFetchMessage(false);
        }
    }, [chatContainerRef.current]);

    if (loading) {
        return (
            <div>
                <div>Loading...</div>
                <ToastContainer />
            </div>
        )
    }

    return (
        <div className="w-screen h-screen bg-[#4a154b] pt-8 pr-1 pb-1 flex">
            <div className="w-20 flex flex-col items-center">
                <WorkspaceNameIcon title={workspace?.name || ""} />
                <Home color={`${selectedTab === 'home' ? 'white' : '#9d9b9f'}`} />
                <More color={`${selectedTab === 'more' ? 'white' : '#9d9b9f'}`} />
            </div>

            <CreateChannelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <div className="h-full w-full rounded-lg flex overflow-hidden">
                <div className="w-1/4 bg-[#611f69] rounded-s-lg">
                    <div className="text-white text-2xl font-bold p-4">{workspace.name}</div>

                    <div className="mx-2">
                        <div
                            className={`flex justify-start items-center my-1 px-4 py-1 cursor-pointer font-medium text-[#d8c6de]`}
                            onClick={() => setIsChannelsOpen(!isChannelsOpen)} // Toggle channels visibility
                        >
                            {!isChannelsOpen ? <ChevronRightIcon /> : <ChevronDownIcon />}
                            <div className="px-2">Channels</div>
                        </div>

                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isChannelsOpen ? 'max-h-96' : 'max-h-10'}`}
                        >
                            {isChannelsOpen && channels.map((channel: ChannelInterface, index) => (
                                <div
                                    key={index}
                                    className={`flex justify-start items-center my-1 px-4 py-1 cursor-pointer font-medium ${selectedField?.id === channel.id ? 'bg-white rounded-md ' : 'text-[#d8c6de]'}`}
                                    onClick={() => handleChannelAndDMClick({
                                        id: channel.id,
                                        name: channel.name,
                                        type: "group"
                                    })}
                                >
                                    <HashIcon color={`${selectedField?.id === channel.id ? 'black' : '#d8c6de'}`} />
                                    <div className="px-2">{channel.name}</div>
                                </div>
                            ))}

                            {!isChannelsOpen && (
                                <div
                                    className={`flex justify-start items-center my-1 px-4 py-1 cursor-pointer font-medium rounded-md ${selectedField?.type === "group" ? "bg-white" : "text-[#d8c6de]"}`}
                                    onClick={() => handleChannelAndDMClick({
                                        id: channels[0].id,
                                        name: channels[0].name,
                                        type: "group"
                                    })}
                                >
                                    <HashIcon color={`${selectedField?.type === "group" ? 'black' : '#d8c6de'}`} />
                                    <div className="px-2">
                                        {
                                            selectedField?.type === "group"
                                                ? selectedField?.name
                                                : channels.length > 0
                                                    ? channels[0].name
                                                    : null
                                        }
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            className={`flex justify-start items-center my-1 px-4 py-1 cursor-pointer font-medium text-[#d8c6de] text-sm`}
                        >
                            <PlusIcon />
                            <div className="px-2" onClick={() => setIsModalOpen(true)}>Add channels</div>
                        </div>
                    </div>

                     <div className="mx-2 mt-4">
                        <div
                            className={`flex justify-start items-center my-1 px-4 py-1 cursor-pointer font-medium text-[#d8c6de]`}
                            onClick={() => setisDMOpen(!isDMOpen)} // Toggle channels visibility
                        >
                            {!isDMOpen ? <ChevronRightIcon /> : <ChevronDownIcon />}
                            <div className="px-2">Direct Messages</div>
                        </div>

                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isDMOpen ? 'max-h-96' : 'max-h-10'}`}
                        >
                            {isDMOpen && members.map((member: MemberInterface, index: number) => (
                                <div
                                    key={index}
                                    className={`my-1 px-4 py-1 cursor-pointer font-medium ${selectedField?.id === member.id ? 'bg-white rounded-md ' : 'text-[#d8c6de]'}`}
                                    onClick={() => handleChannelAndDMClick({
                                        id: member.id,
                                        name: member.username,
                                        type: "user",
                                        status: member.status
                                    })}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex justify-start items-center">
                                            <HashIcon color={`${selectedField?.id === member.id ? 'black' : '#d8c6de'}`} />
                                            <div className="px-2">{member.username}</div>
                                        </div>
                                        <div className="flex justify-end items-center gap-2">
                                            { member.status === "online" && <div className="h-3 w-3 rounded-full bg-[#1add1a]"></div> }
                                            { member.unseen > 0 && <div className="h-4 w-4 rounded-full bg-yellow-400 text-center text-xs text-black flex justify-center items-center">{member.unseen}</div> }
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {!isDMOpen && (
                                <div
                                    className={`my-1 px-4 py-1 cursor-pointer font-medium rounded-md ${selectedField?.type === "user" ? "bg-white" : "text-[#d8c6de]"}`}
                                    onClick={() => handleChannelAndDMClick({
                                        id: members[0].id,
                                        name: members[0].username,
                                        type: "user",
                                        status: members[0].status
                                    })}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex justify-start items-center">
                                            <HashIcon color={`${selectedField?.type === "user" ? 'black' : '#d8c6de'}`} />
                                            <div className="px-2">
                                                {
                                                    selectedField?.type === "user"
                                                        ? selectedField?.name
                                                        : channels.length > 0
                                                            ? members[0].username
                                                            : null
                                                }
                                            </div>
                                        </div>
                                        <div className="flex justify-end items-center gap-2">
                                            { ((selectedField?.type === "user" && selectedField?.status === "online") || (selectedField?.type !== "user" && channels.length > 0 && members[0].status === "online")) && <div className="h-3 w-3 rounded-full bg-[#1add1a]"></div> }
                                            { (selectedField?.type !== "user" && members[0]?.unseen > 0) && <div className="h-4 w-4 rounded-full bg-yellow-400 text-center text-xs text-black flex justify-center items-center">{members[0]?.unseen}</div> }
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            className={`flex justify-start items-center my-1 px-4 py-1 cursor-pointer font-medium text-[#d8c6de] text-sm`}
                        >
                            <PlusIcon />
                            <div className="px-2" onClick={() => setIsModalOpen(true)}>Invite People</div>
                        </div>
                    </div>
                </div>
                <div className="w-3/4 bg-white rounded-e-lg">
                    <div className="flex flex-col max-h-screen bg-gray-100 dark:bg-gray-900">
                        <ChatContainer ref={chatContainerRef} wsClientRef={wsClientRef.current} chatId={chatId!} type={type} isFetchingMessage={isFetchingMessage} setIsFetchingMessage={setIsFetchingMessage} onWsMessage={handleChatEvent} />
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    )
}
