import { FormEvent, useEffect, useRef, useState } from "react";
import { Home } from "../components/Icons/Home";
import { More } from "../components/Icons/More";
import { WorkspaceNameIcon } from "../components/Icons/WorkspaceNameIcon";
import { LinkIcon } from "../HeroIcons/Link";
import axios, { AxiosError } from "axios";
import { toast, ToastContainer } from "react-toastify";
import { RefreshToken } from "../utils/refreshToken";
import { useNavigate } from "react-router-dom";
import { LoginStatus } from "../utils/loginStatus";

export const WorkspaceSetup = () => {
    let questions = useRef([
        'What’s the name of your company or team?',
        'What’s your name?',
        'Who else is on the Temp Workspace team?',
        'What’s your team working on right now?',
    ]);
    let suggestions = useRef([
        'This will be the name of your Slack workspace.',
        'Help your teammates to recognise and connect with you more easily.',
        'Add colleagues by email',
        'This could be anything: a project, campaign, event or the deal you’re trying to close.',
    ]);
    let placeholders = useRef([
        'e.g. A1 or A1 Marketing',
        'Enter your full name',
        'Example ellis@gmail.com, maria@gmail.com',
        'E.g. Q4 Budget autumn campaign'
    ]);

    const [step, setStep] = useState(1);
    const [workspaceName, setWorkspaceName] = useState('');
    const [about, setAbout] = useState('');
    const [members, setMembers] = useState('');
    const [commonInputField, setCommonInputField] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
   
    async function createWorkspaceAndChannelRequest() {
        try {
            const response1 = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/workspace`,{
                name: workspaceName,
                about: about,
                members: members
            },{
                withCredentials: true
            });
            const response2 = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/channel`,{
                    workspaceId: response1.data.workspace.id,
                    name: 'General'
                },
                {
                    withCredentials: true
                }
            );
            
            navigate(`/workspace/${response1.data.workspace.id}/${response2.data.channel.id}`);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async function handleCreateWorkspace() {
        try {
            await createWorkspaceAndChannelRequest();
        } catch (error: AxiosError | any) {
            if(error.response && error.response.status === 401) {
                try {
                    await RefreshToken();
                } catch (error: AxiosError | any) {
                    toast.error(error.response.data.message, {
                        onClose: () => navigate('/signin')
                    });
                }
            }
        }
    }

    const handleNextButton = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const currentCommonInput = commonInputField;
        if (step === 1) {
            setWorkspaceName(currentCommonInput);
        } else if (step === 4) {
            setAbout(currentCommonInput);
            return;
        }
        
        setCommonInputField('');
        setStep(step + 1);
    }    

    async function main() {
        try {
            await LoginStatus();
            setLoading(false);
        } catch (error: AxiosError | any) {
            toast.error(error.response.data.message,{
                onClose: () => navigate('/signin')
            });
        }
    }

    useEffect(() => {
        main();
    },[]);

    useEffect(() => {
        if (step === 4 && about) {
            handleCreateWorkspace();
        }
    }, [about]);

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
                {/*rgb(226, 193, 226) */}
                <WorkspaceNameIcon title={workspaceName} />
                <Home color={`${step === 3 ? 'white' : '#9d9b9f'}`} />
                <More color="#9d9b9f"/>
            </div>

            <div className="h-full w-full rounded-lg flex">
                <div className="w-1/4 bg-[#611f69] rounded-s-lg"></div>
                <form onSubmit={handleNextButton} className="w-3/4 bg-white py-20 pl-16 pr-72 rounded-e-lg">
                    <div className="text-[#9d9b9f] text-sm font-medium">Step {step} of 4</div> 
                    <div className="text-5xl font-bold">{questions.current[step - 1]}</div>
                    <div className="my-6 text-[#383738] font-medium">{suggestions.current[step - 1]}</div>
                    <div className="w-full text-sm">
                            {step === 3 && (
                                <textarea 
                                    className="p-2 text-black w-full border-[1px] rounded-xl border-slate-400"
                                    rows={6}
                                    placeholder={placeholders.current[step - 1]}
                                    value={members}
                                    onChange={e => setMembers(e.target.value)}
                                    required={true}
                                >
                                </textarea>
                            )}
                            {step !== 3 && (
                                <input 
                                    type="text" 
                                    className="p-2 text-black w-full border-[1px] rounded-xl border-slate-400"
                                    placeholder={placeholders.current[step - 1]}
                                    value={commonInputField}
                                    onChange={e => setCommonInputField(e.target.value)}
                                    required={true}
                                />
                            )}
                    </div>
                    <div className="flex justify-start items-center mt-16">
                        <button 
                            type="submit" 
                            className="px-12 py-1 bg-[#dddddd] rounded-lg font-semibold mx-2"
                        >Next</button>

                        {step === 3 && (
                            <>
                                <div className="px-4 py-1 rounded-lg font-semibold border-[1px] border-slate-500 flex justify-between mx-2">
                                    <LinkIcon />
                                    <button type="button">Copy Invitation Link</button>
                                </div>

                                <div className="text-sm mx-2 hover:underline">
                                    <button 
                                        type="button"
                                        onClick={() => setStep(4)}
                                    >Skip this step</button>
                                </div>
                            </>
                        )}
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    )
}