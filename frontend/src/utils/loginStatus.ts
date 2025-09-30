import { CheckAuth } from "./checkAuth";
import { RefreshToken } from "./refreshToken";

export async function LoginStatus(): Promise<boolean> {
    try {
        await CheckAuth();
        return true;
    } catch (error) {
        try {
            await RefreshToken();
            return true;
        } catch (error) {
            return Promise.reject(error);
        }
    }
}