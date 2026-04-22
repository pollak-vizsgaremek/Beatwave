import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const clearLegacyLocalStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("spotifyTimeRange");

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("likedPosts:")) {
      localStorage.removeItem(key);
    }
  });
};

clearLegacyLocalStorage();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
