import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.js";
import LoadingState from "../common/LoadingState.jsx";

/** Renders child routes only for signed-in users. */
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingState />;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
