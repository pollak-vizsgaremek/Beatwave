import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.error ?? "").toLowerCase();
    const skipAuthRedirect =
      error?.config?.headers?.["X-Skip-Auth-Redirect"] === "1" ||
      error?.config?.headers?.["x-skip-auth-redirect"] === "1";
    const isAuthFailure =
      status === 401 ||
      (status === 403 && message.includes("invalid token"));

    if (isAuthFailure && !skipAuthRedirect) {
      const url = error.config?.url;
      if (url && !url.includes("/login") && !url.includes("/register")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
