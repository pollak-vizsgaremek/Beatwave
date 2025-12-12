import "./App.css";
import { Route, Routes } from "react-router";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";

function App() {
  return (
    <>
      <Routes>
        <Route element={<Login />} path='login' />
        <Route element={<ProtectedRoute />}>
          <Route index element={<Home />} path='home' />
        </Route>
      </Routes>
    </>
  );
}

export default App;
