import { useEffect } from "react";
import { GoogleIcon } from "../HeroIcons/GoogleIcon";
import { useNavigate } from "react-router-dom";
import { LoginStatus } from "../utils/loginStatus";

export const Signin = () => {
    const navigate = useNavigate();

    const handleGoogleSignIn = async() => {
        window.open(`${import.meta.env.VITE_BACKEND_URL}/auth/google`, "_self");
    };

    async function main() {
        try {
            await LoginStatus();
            if(sessionStorage.getItem("joinToken")){
                navigate(`/join/${sessionStorage.getItem("joinToken")}`);
            } else {
                navigate("/temp");
            }
        } catch (error) {
            console.error(error);
        }
    }
    useEffect(() => {
        main();
    }, [])

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="text-center w-full max-w-xl">
                <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="mx-auto mb-6"
                />
                <div className="text-5xl font-bold mb-4">
                    First of all, enter your email address
                </div>
                <div className="text-xl text-semibold text-gray-700 mb-6">
                    We Suggest using the <strong>email address that you use at work.</strong>
                </div>
                <div 
                    className="flex justify-center items-center text-center rounded-xl border border-gray-400 py-2 px-4 mt-8 font-semibold text-xl w-2/3 mx-auto cursor-pointer"
                    onClick={handleGoogleSignIn}
                >
                    <GoogleIcon />
                    <div className="mx-4">Continue with Google</div>
                </div>
                <div className="flex text-gray-700 text-sm justify-center items-center mt-4">
                    <div className="mx-4">Privacy & Terms</div>
                    <div className="mx-4">Contact us</div>
                </div>
            </div>
        </div>
    );
};
