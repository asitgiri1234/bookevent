import axios from "axios";

// Single axios instance for the whole app. Base URL points at the backend API;
// override it with VITE_API_URL in a .env file if your backend runs elsewhere.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the JWT (if logged in) to every outgoing request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
