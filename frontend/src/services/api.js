
import axios from "axios";

// Centralized API configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15000
});

// Attach JWT token automatically to protected API requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("finsight_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Allow Axios to set the multipart boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized response error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        "API Error:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error("Backend server is not responding.");
    } else {
      console.error("Request configuration error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default API;
