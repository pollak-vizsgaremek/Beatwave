import { Route, Routes } from "react-router";

import ProtectedRoute from "./components/ProtectedRoute";
import Background from "./components/Background";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Discussion from "./pages/Discussion";
import UserProfile from "./pages/UserProfile";
import Register from "./pages/Register";

function App() {
  return (
    <>
      <Background />
      <Routes>
        <Route element={<Login />} path="login" />
        <Route element={<Register />} path="register" />
        <Route element={<ProtectedRoute />}>
          <Route index element={<Home />} path="home" />
          <Route element={<Discussion />} path="discussion" />
          <Route element={<UserProfile />} path="profile" />
        </Route>
      </Routes>
    </>
  );
}

export default App;
