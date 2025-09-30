import axios from "axios";

export async function CheckAuth(): Promise<boolean> {
    try {
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/check-auth`, {withCredentials: true});
        return true;
    } catch (error) {
        return Promise.reject(error);
    }
}