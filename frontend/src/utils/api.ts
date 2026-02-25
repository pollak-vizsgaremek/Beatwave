import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:6969",
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
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If server says 401 Unauthorized, log out the user
      // BUT ignore if using Dev Token
      console.error(
        "401 Unauthorized Intercepted from URL:",
        error.config?.url,
      );
      const token = localStorage.getItem("token");
      if (token !== "DEV_TOKEN") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
