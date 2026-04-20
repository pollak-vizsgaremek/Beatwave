import { useEffect, useState } from "react";
import { Outlet } from "react-router";

import Navigation from "./Navigation";
import api from "../utils/api";
import { setStoredUser } from "../utils/auth";

const ProtectedRoute = () => {
  const [authState, setAuthState] = useState<"checking" | "allowed" | "blocked">(
    "checking",
  );

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      try {
        const response = await api.get("/user-profile?includeSpotify=false");
        if (!mounted) {
          return;
        }

        setStoredUser({
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          role: response.data.role,
        });
        setAuthState("allowed");
      } catch {
        if (!mounted) {
          return;
        }

        setStoredUser(null);
        setAuthState("blocked");
      }
    };

    void verifySession();

    return () => {
      mounted = false;
    };
  }, []);

  if (authState === "checking") {
    return null;
  }

  if (authState === "blocked") {
    window.location.href = "/login";
    return null;
  }

  return (
    <div>
      <Navigation />
      <Outlet />
    </div>
  );
};

export default ProtectedRoute;
