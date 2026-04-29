import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

import Navigation from "./Navigation";
import { DiscussionToolbarProvider } from "../context/DiscussionToolbarContext.tsx";
import api from "../utils/api";
import { createSessionUser, useSession } from "../context/SessionContext";

const ProtectedRoute = () => {
  const { setCurrentUser } = useSession();
  const [authState, setAuthState] = useState<
    "checking" | "allowed" | "blocked"
  >("checking");

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      try {
        const response = await api.get("/user-profile?includeSpotify=false", {
          headers: {
            "X-Skip-Auth-Redirect": "1",
          },
        });
        if (!mounted) {
          return;
        }

        setCurrentUser(createSessionUser(response.data));
        setAuthState("allowed");
      } catch {
        if (!mounted) {
          return;
        }

        setCurrentUser(null);
        setAuthState("blocked");
      }
    };

    void verifySession();

    return () => {
      mounted = false;
    };
  }, [setCurrentUser]);

  if (authState === "checking") {
    return null;
  }

  if (authState === "blocked") {
    return <Navigate to="/login" replace />;
  }

  return (
    <DiscussionToolbarProvider>
      <div>
        <Navigation />
        <Outlet />
      </div>
    </DiscussionToolbarProvider>
  );
};

export default ProtectedRoute;
