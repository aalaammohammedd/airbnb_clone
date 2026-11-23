import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "../components/Auth/AuthShell";
import { setProfile } from "../store/Slices/authslice";

export default function Login() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        if (result.message?.toLowerCase().includes("verify your email")) {
          const email = data.email.trim().toLowerCase();
          localStorage.setItem("pendingVerificationEmail", email);
          localStorage.removeItem("registerEmail");
          navigate("/verify-account", { state: { email } });
          return;
        }
        throw new Error(result.message || "Login failed");
      }

      if (result.user) dispatch(setProfile(result.user));
      localStorage.removeItem("pendingVerificationEmail");
      localStorage.removeItem("registerEmail");
      const returnPath = location.state?.from?.pathname;
      const isInternalReturnPath =
        typeof returnPath === "string" &&
        returnPath.startsWith("/") &&
        !returnPath.startsWith("//");
      navigate(
        isInternalReturnPath
          ? {
              pathname: returnPath,
              search: location.state.from.search,
              hash: location.state.from.hash,
            }
          : "/homes",
        { replace: true }
      );
    } catch (requestError) {
      setError(requestError.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Welcome back"
      subtitle="Log in to continue to Airbnb."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-sm font-medium text-[#222]">Email</label>
            <input
              id="login-email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email",
                },
              })}
              className="h-12 w-full rounded-lg border border-[#b0b0b0] px-3 text-sm text-[#222] outline-none transition placeholder:text-[#717171] focus:border-[#222] focus:ring-1 focus:ring-[#222]"
              placeholder="you@example.com"
            />

            {errors.email && (
              <p className="text-sm text-red-600" role="alert">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-sm font-medium text-[#222]">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters long",
                  },
                })}
                className="h-12 w-full rounded-lg border border-[#b0b0b0] px-3 pr-12 text-sm text-[#222] outline-none transition placeholder:text-[#717171] focus:border-[#222] focus:ring-1 focus:ring-[#222]"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#717171] hover:text-[#222]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-lg bg-[#ff385c] text-sm font-semibold text-white transition hover:bg-[#e61e4d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
      </form>
      <div className="mt-5 flex flex-col items-center gap-2 text-sm">
        <Link to="/forget-password" className="font-medium text-[#222] underline underline-offset-2">
          Forgot password?
        </Link>
        <p className="text-[#717171]">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-semibold text-[#222] underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
