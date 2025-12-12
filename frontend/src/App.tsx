import { Route, Routes } from "react-router";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Discussion from './pages/Discussion';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <>
      <Routes>
        <Route element={<Login />} path='login' />
        <Route element={<ProtectedRoute />}>
          <Route index element={<Home />} path='home' />
          <Route path="/discussion" element={<Discussion />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
