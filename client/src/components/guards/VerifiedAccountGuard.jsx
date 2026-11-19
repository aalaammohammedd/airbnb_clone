import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function VerifiedAccountGuard({ children }) {
  const user = useSelector((state) => state.auth.user);
  const email =
    localStorage.getItem("pendingVerificationEmail") || user?.email;

  if (
    localStorage.getItem("pendingVerificationEmail") ||
    user?.isVerified === false
  ) {
    return (
      <Navigate
        to="/verify-account"
        state={{ email }}
        replace
      />
    );
  }

  return children;
}
