import Navigation from "./Navigation";
import { Outlet } from "react-router";

const ProtectedRoute = () => {
  const isAuthenticated = true; // Replace with actual authentication logic

  if (!isAuthenticated) {
    return <div>Please log in to access this page.</div>;
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
