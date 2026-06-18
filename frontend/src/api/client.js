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

// Self-heal on auth failure: if a protected request comes back 401, the stored
// token is missing/expired/invalid. Clear the cached auth and send the user to
// login so they get a fresh, valid token instead of being stuck on an error.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthRequest = url.includes("/auth/"); // don't bounce on login/register

    if (status === 401 && !isAuthRequest && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        // Full redirect so React state resets cleanly.
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;
