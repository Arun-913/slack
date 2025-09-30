import { useNavigate } from "react-router-dom";
import { LeftArrow } from "../HeroIcons/LeftArrow";

function getShortName(name: string) {
    let shortName = "";
    if(name.split(" ").length > 1) {
        shortName = name.split(" ")[0][0] + name.split(" ")[1][0];
    }
    else if(name.split("-").length > 1) {
        shortName = name.split("-")[0][0] + name.split("-")[1][0];
    }
    else {
        shortName = name[0];
    }
    return shortName.toLocaleUpperCase();
}

export const Workspace = ({ email, name, members, invitation = false, id: workspaceId, channelId }: {
    email: string,
    name: string,
    members: number,
    invitation?: boolean,
    id: string,
    channelId: string
}) =>{
    let shortName = getShortName(name);
    const navigate = useNavigate();
    
    return (
        <div className="w-full border-2 shadow-xl rounded-lg mb-12">
            <div className="px-6 py-4 text-left">
                {!invitation ? "Workspaces" : "Invitations"} for <b>{email}</b>
            </div>
            <hr />

            {!invitation && (  
                <div 
                    className="relative flex justify-between items-center px-6 py-4 hover:bg-[#f0f0f0] hover:cursor-pointer group"
                    onClick={() => navigate(`/workspace/${workspaceId}/${channelId}`)}
                >
                    <div className="flex justify-center items-center">
                        <div className="bg-[#616061] font-bold w-12 h-12 mr-4 text-white text-center rounded text-2xl flex items-center justify-center">
                            {shortName}
                        </div>
                        <div>
                            <div className="font-semibold text-xl">{name}</div>
                            <div className="text-left">{members} members</div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-0 transition-all duration-300 ease-in-out translate-x-[-10px]">
                            <span className="text-blue-500 font-semibold">Open</span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transform group-hover:translate-x-0 transition-all duration-300 ease-in-out translate-x-[-10px]">
                            <LeftArrow className="text-black group-hover:text-blue-500" />
                        </div>
                    </div>
                </div>
            )}

            {invitation && (
                <div className="relative flex justify-between items-center px-6 py-4">
                    <div className="flex justify-center items-center">
                        <div className="bg-[#616061] font-bold w-12 h-12 mr-4 text-white text-center rounded text-2xl flex items-center justify-center">
                            {shortName}
                        </div>
                        <div>
                            <div className="font-semibold text-xl">{name}</div>
                            <div className="text-left">{members} members</div>
                        </div>
                    </div>

                    <div className="p-2 border-x border-y border-gray-600 hover:cursor-pointer rounded-xl w-16 font-semibold hover:bg-[#f4f4f4]">Join</div>
                </div>
            )}
        </div>
    )
}