import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:6969",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.error ?? "").toLowerCase();
    const isAuthFailure =
      status === 401 ||
      (status === 403 &&
        (message.includes("ervenytelen token") ||
          message.includes("érvénytelen token") ||
          message.includes("invalid token")));

    if (isAuthFailure) {
      const url = error.config?.url;
      if (url && !url.includes("/login") && !url.includes("/register")) {
        if (import.meta.env.DEV) {
          console.error("Auth failure intercepted from URL:", url);
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
