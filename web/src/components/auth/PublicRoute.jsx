import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.js";
import LoadingState from "../common/LoadingState.jsx";

/** Login / register: signed-in users are redirected (new sign-ups to their profile). */
const PublicRoute = () => {
  const { isAuthenticated, justRegistered, loading } = useAuth();

  if (loading) return <LoadingState />;

  return isAuthenticated ? <Navigate to={justRegistered ? "/profile" : "/feed"} replace /> : <Outlet />;
};

export default PublicRoute;
