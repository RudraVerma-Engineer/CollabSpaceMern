import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import PublicRoute from "./components/auth/PublicRoute.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import MainLayout from "./layouts/MainLayout.jsx";

import Chat from "./pages/Chat.jsx";
import Feed from "./pages/Feed.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import Notifications from "./pages/Notifications.jsx";
import People from "./pages/People.jsx";
import Profile from "./pages/Profile.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import ProjectEditor from "./pages/ProjectEditor.jsx";
import Projects from "./pages/Projects.jsx";
import Register from "./pages/Register.jsx";
import Requests from "./pages/Requests.jsx";
import Search from "./pages/Search.jsx";
import UserProfile from "./pages/UserProfile.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Signed-out only */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
        </Route>

        {/* Signed-in only */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/feed" element={<Feed />} />

            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<ProjectEditor />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/projects/:projectId/edit" element={<ProjectEditor />} />

            <Route path="/people" element={<People />} />
            <Route path="/people/:userId" element={<UserProfile />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/messages" element={<Chat />} />
            <Route path="/messages/:conversationId" element={<Chat />} />

            <Route path="/requests" element={<Requests />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/search" element={<Search />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/dashboard" element={<Navigate to="/feed" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
