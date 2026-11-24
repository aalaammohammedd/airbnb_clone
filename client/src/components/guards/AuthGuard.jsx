import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/",
}) {
  const location = useLocation();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) return null;

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}