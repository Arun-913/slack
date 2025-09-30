import { useNavigate } from "react-router-dom";
import { Workspace } from "../components/Workspace";
import { useEffect, useRef, useState } from "react";
import { LoginStatus } from "../utils/loginStatus";
import { toast, ToastContainer } from "react-toastify";
import axios, { AxiosError } from "axios";

export const Landing1 = () => {
    const email = useRef('');
    const navigate = useNavigate();
    const [workspaces, setWorkspaces] = useState([]);

    async function main() {
        try {
            await LoginStatus();
            
            const params = new URLSearchParams(window.location.search);
            const userId = params.get("userId");
            if(userId) {
                localStorage.setItem("userId", userId);
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/workspace`,{withCredentials: true});
            setWorkspaces(res.data.workspaces);
            email.current = res.data.email;
        } catch (error: AxiosError | any) {
            toast.error(error.response.data.message,{
                onClose: () => navigate('/signin')
            });
        }
    }

    useEffect(() => {
        main();
    }, []);

    return (
        <div className="min-h-screen absolute">
            <div className="bg-[#f9f6f1] h-auto">
                <h1 className="text-3xl font-bold w-full text-center py-4">
                    slack
                </h1>
                <div className="mx-auto flex justify-center items-center">
                    <div className="text-sm text-center bg-white inline-block px-6 py-2 rounded-2xl">
                        <span>Confirmed as <b>{email.current} &nbsp;</b> </span>
                        <span className="hover:underline hover:cursor-pointer hover:text-blue-500 text-blue-600">Change</span>
                    </div>
                </div>

                <div className="flex justify-between items-center pl-80 pr-28 pb-10">
                    <div className="w-1/2 mr-6">
                        <h1 className="text-5xl font-bold mb-10">Create a new Slack workspace</h1>
                        <div className="text-lg mb-8 font-">Slack gives your team a home – a place where they can talk and work together. To create a new workspace, click on the button below.</div>
                        <button 
                            type="button" 
                            className="bg-[#611f69] text-xl font-semibold w-full text-white text-center py-2 rounded-xl"
                            onClick={() => navigate("/workspace")}
                        >
                            Create a workspace
                        </button>
                    </div>
                    <div className="w-1/2 relative ml-8">
                        <img src="/images/landingImage.svg" alt="Three colleagues work together, sharing files and sending messages back and forth." className="w-full h-auto"/>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 text-sm opacity-0 hover:opacity-100">
                            Three colleagues work together, sharing files and sending messages back and forth.
                        </div>
                    </div>
                </div>
            </div>
            <div className="relative flex items-center justify-center my-6 top-[-70px] left-1/2 transform -translate-x-1/2 w-1/2">
                <div className="relative text-center w-full">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xl bg-white px-4 text-[#606060] font-semibold rounded-full w-20 h-20 flex justify-center items-center">
                        OR
                    </div>
                    <div className="mt-24 text-xl font-bold mb-4">
                        Open a workspace
                    </div>

                    {workspaces.map((workspace: any) => (
                        <Workspace key={workspace.id} {...workspace} email={workspace.createdByUser.email} />
                    ))}
                    {/* <Workspace email={'arunsc@kesari.in'} name="Kesari-Infotech" members={19} />
                    <Workspace email={'arunsc@kesari.in'} name="Kesari-Infotech" members={19} /> */}

                    {/* <div className="text-xl font-bold mb-4 text-left">
                        Accept an invitation
                    </div>
                    
                    <Workspace email={'arunsc@kesari.in'} name="Kesari Tours" members={19} invitation={true}/> */}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};
