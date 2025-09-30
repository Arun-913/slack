import { useEffect } from "react";
import { LoginStatus } from "../utils/loginStatus";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export const Join = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                await LoginStatus();
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/channel/join/${token}`, { token: token }, { withCredentials: true });
                sessionStorage.removeItem("joinToken");
                navigate('/temp');
            } catch (error) {
                sessionStorage.setItem("joinToken", token!);
                navigate('/signin');
            }
        })();
    })
    return (
        <></>
    )
};