import axios from "axios";

export async function RefreshToken(): Promise<boolean> {
    try {
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/refresh-token`, {withCredentials: true});
        return true;
    } catch (error) {
        return Promise.reject(error);
    }
}