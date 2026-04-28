import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <SkeletonTheme
      baseColor="rgba(255,255,255,0.08)"
      highlightColor="rgba(255,255,255,0.16)"
      borderRadius={12}
      duration={1.15}
    >
      <App />
    </SkeletonTheme>
  </BrowserRouter>,
);
