import axios from "axios";
import { apiUrl } from "./api";

// Become a host
export const becomeHost = async () => {
    try {
        const response = await axios.post(
            apiUrl("become-host"),
            {},
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

// Get current user profile
export const getUserProfile = async () => {
    try {
        const response = await axios.get(apiUrl("profile"), { withCredentials: true });
        // console.log(response.data.role);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};