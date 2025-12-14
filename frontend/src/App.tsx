import { Route, Routes, useLocation } from "react-router";
import { AnimatePresence } from "framer-motion";

import ProtectedRoute from "./components/ProtectedRoute";
import Background from "./components/Background";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Discussion from "./pages/Discussion";
import UserProfile from "./pages/UserProfile";
import Register from "./pages/Register";

function App() {
  const location = useLocation();

  return (
    <>
      <Background />
      <AnimatePresence mode="popLayout">
        <Routes location={location} key={location.pathname}>
          <Route element={<Login />} path="login" />
          <Route element={<Register />} path="register" />
          <Route element={<ProtectedRoute />}>
            <Route index element={<Home />} path="home" />
            <Route element={<Discussion />} path="discussion" />
            <Route element={<UserProfile />} path="profile" />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
