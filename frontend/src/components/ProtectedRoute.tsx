import { Outlet } from "react-router";

import Navigation from "./Navigation";
import { isTokenExpired } from "../utils/auth";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  // Check if token exists AND is valid (not expired)
  if (!token || isTokenExpired(token)) {
    // Clear any invalid/expired data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect to login
    window.location.href = "/login";
    return null;
  }

  return (
    <div>
      <div>
        <Navigation />
      </div>

      <Outlet />
    </div>
  );
};

export default ProtectedRoute;
