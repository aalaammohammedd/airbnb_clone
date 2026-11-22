import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { clearResetEmail } from "../store/Slices/authslice";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ResetPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { resetEmail } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: resetEmail,
          newPassword: data.newPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to reset password");
      }
      setSuccessMessage(result.message || "Password reset successfully.");
      dispatch(clearResetEmail());
      navigate("/login");
    } catch (requestError) {
      setError(requestError.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl border border-gray-300 w-full max-w-lg">

        <h2 className="text-2xl font-semibold text-center mb-6">
          Reset Password
        </h2>

        {!resetEmail && (
          <p className="text-center text-red-600 mb-4">
            You cannot reset password without verification.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* New Password */}
          <div>
            <label className="text-sm font-medium">New Password</label>
            <input
              type="password"
              className="w-full border rounded-md p-2"
              {...register("newPassword", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              placeholder="Enter new password"
              disabled={!resetEmail}
            />
            {errors.newPassword && (
              <p className="text-red-500 text-xs">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              className="w-full border rounded-md p-2"
              {...register("confirmPassword", {
                validate: (value) =>
                  value === watch("newPassword") || "Passwords don't match",
              })}
              placeholder="Confirm new password"
              disabled={!resetEmail}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Errors from Server */}
          {error && <p className="text-red-500 text-center">{error}</p>}

          {/* Success */}
          {successMessage && (
            <p className="text-green-500 text-center">{successMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading || !resetEmail}
            className="w-full bg-black text-white py-2 rounded-md disabled:opacity-50 hover:bg-gray-900"
          >
            {loading ? "Saving..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
