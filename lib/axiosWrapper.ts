import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { getRequestCookies } from "./axiosContext";


const api: AxiosInstance = axios.create({
  // baseURL: process.env.BACKEND_API_URL,
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// api.interceptors.request.use((config) => {
//   const cookies = getRequestCookies();
//   // console.log("Cookies headers: ", config.headers.cookie);

//   if (cookies) {
//     config.headers = config.headers || {};
//     config.headers.cookie = cookies;
//     console.log("Cookies headers: ", config.headers);
//   }

//   return config;
// });

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
        console.log("Refreshing token");
        const refreshResponse = await api.post("/api/auth/refresh-token");
        
        const newAccessToken = refreshResponse.data.accessToken;
        
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
    // Set Content-Type based on data type
    const headers: any = {};
    if (data instanceof FormData) {
      // Let browser set Content-Type for FormData
      delete headers['Content-Type'];
    } else {
      headers['Content-Type'] = 'application/json';
    }
    
    return await api.post<T>(url, data, { ...config, headers });
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
    // Set Content-Type based on data type
    const headers: any = {};
    if (data instanceof FormData) {
      // Let browser set Content-Type for FormData
      delete headers['Content-Type'];
    } else {
      headers['Content-Type'] = 'application/json';
    }
    
    return await api.put<T>(url, data, { ...config, headers });
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
