import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { getRequestCookies } from "./axiosContext";
import { cookies } from "next/headers";


const api: AxiosInstance = axios.create({
  baseURL: process.env.BACKEND_API_URL,
  withCredentials: true,
});

// Request interceptor to add access token from cookies for server-side requests
api.interceptors.request.use(async (config) => {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("tgaAccessToken")?.value;
    console.log("Access token:", accessToken);
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch (error) {
    console.error('Error getting access token from cookies:', error);
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 403 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Get refresh token from cookies
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("tgaRefreshToken")?.value;
        console.log("Refreshing token ", refreshToken);
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const refreshResponse = await api.post("/auth/refresh-token", { refreshToken });
        const newAccessToken = refreshResponse.data.data.accessToken;
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Optional: you can handle logout here or clear client state
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

function formatAxiosError(error: any) {
  return {
    message:
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An error occurred.",
    status: error.response?.status,
    code: error.code,
    data: error.response?.data,
  };
}

// POST wrapper
export async function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  try {
    // Set appropriate Content-Type based on data type
    const finalConfig = { ...config };
    if (data instanceof FormData) {
      // Let the browser set the Content-Type for FormData
      delete finalConfig.headers?.['Content-Type'];
    } else {
      finalConfig.headers = {
        'Content-Type': 'application/json',
        ...finalConfig.headers,
      };
    }
    
    return await api.post<T>(url, data, finalConfig);
  } catch (error: any) {
    throw formatAxiosError(error);
  }
}

// GET wrapper
export async function get<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  try {
    console.log("GET request to:", url);
    return await api.get<T>(url, config);
  } catch (error: any) {
    throw formatAxiosError(error);
  }
}

// PUT wrapper
export async function put<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  try {
    // Set appropriate Content-Type based on data type
    const finalConfig = { ...config };
    if (data instanceof FormData) {
      // Let the browser set the Content-Type for FormData
      delete finalConfig.headers?.['Content-Type'];
    } else {
      finalConfig.headers = {
        'Content-Type': 'application/json',
        ...finalConfig.headers,
      };
    }
    
    return await api.put<T>(url, data, finalConfig);
  } catch (error: any) {
    throw formatAxiosError(error);
  }
}

// DELETE wrapper
export async function del<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  try {
    return await api.delete<T>(url, config);
  } catch (error: any) {
    throw formatAxiosError(error);
  }
}

export default api;
