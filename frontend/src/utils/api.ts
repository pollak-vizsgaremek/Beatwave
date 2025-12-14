import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:6969",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If server says 401 Unauthorized, log out the user
      // BUT ignore if using Dev Token
      const token = localStorage.getItem("token");
      if (token !== "DEV_TOKEN") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
