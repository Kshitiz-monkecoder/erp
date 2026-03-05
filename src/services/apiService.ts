import axios from 'axios';

// Define base URL from environment or use default
const BASE_URL = import.meta.env.VITE_BASE_URL   || 'erpapi.smtch.in';

// Create axios instance with base config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log("🔐 API Request Interceptor:");
    console.log("URL:", config.url);
    console.log("Token exists:", !!token);
    console.log("Token value:", token ? `${token.substring(0, 20)}...` : "No token");
    
    if (token && config.headers) {
      config.headers.Authorization = `${token}`;
      console.log("Authorization header set");
    } else {
      console.log("No token, request will be unauthorized");
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      console.error("⚠️ 401 Unauthorized error. Token removed.");
      console.error("Error details:", error.response?.data);
      // window.location.href = '/login'; // COMMENT THIS OUT TEMPORARILY
    }
    return Promise.reject(error);
  }
);

// Generic API functions
export const get = async <T = any>(url: string, config?: any): Promise<T> => {
  try {
    const response = await api.get<T>(url, config);
    return response.data;
  } catch (error) {
    console.error('GET Error:', error);
    throw error;
  }
};

export const post = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  try {
    const response = await api.post<T>(url, data, config);
    return response.data;
  } catch (error) {
    console.error('POST Error:', error);
    throw error;
  }
};

export const put = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  try {
    const response = await api.put<T>(url, data, config);
    return response.data;
  } catch (error) {
    console.error('PUT Error:', error);
    throw error;
  }
};

export const del = async <T = any>(url: string, config?: any): Promise<T> => {
  try {
    const response = await api.delete<T>(url, config);
    return response.data;
  } catch (error) {
    console.error('DELETE Error:', error);
    throw error;
  }
};

// Upload file function
export const uploadFile = async <T = any>(url: string, file: File, fieldName = 'file'): Promise<T> => {
  try {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    const response = await api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

// Export axios instance for custom use cases
export default api;