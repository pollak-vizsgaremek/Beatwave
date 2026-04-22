import { Route, Routes, useLocation } from "react-router";
import { AnimatePresence } from "framer-motion";

import ProtectedRoute from "./components/ProtectedRoute";
import Background from "./components/Background";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Discussion from "./pages/Discussion";
import UserProfile from "./pages/UserProfile";
import Register from "./pages/Register";
import SearchResult from "./pages/SearchResult";
import CreateDiscusson from "./pages/CreatePost";
import Error404 from "./pages/Error404";
import ViewDiscussion from "./pages/ViewDiscusson";
import ViewProfile from "./pages/ViewProfile";
import AdminPanel from "./pages/AdminPanel";
import { SessionProvider } from "./context/SessionContext";
import ArtistView from "./pages/ArtistView";

function App() {
  const location = useLocation();

  return (
    <SessionProvider>
      <Background />
      <AnimatePresence mode="popLayout">
        <Routes location={location} key={location.pathname}>
          <Route element={<Login />} path="login" />
          <Route element={<Register />} path="register" />
          <Route element={<ProtectedRoute />}>
            <Route index element={<Home />} path="home" />
            <Route element={<UserProfile />} path="profile" />
            <Route element={<ViewProfile />} path="profile/:id" />
            <Route element={<SearchResult />} path="search" />
            <Route element={<Discussion />} path="discussion" />
            <Route element={<CreateDiscusson />} path="discussion/create" />
            <Route element={<ViewDiscussion />} path="discussion/view/:id" />
            <Route element={<AdminPanel />} path="admin" />
            <Route element={<ArtistView />} path="artist/:id" />
          </Route>
          <Route element={<Error404 />} path="*" />
        </Routes>
      </AnimatePresence>
    </SessionProvider>
  );
}

export default App;
