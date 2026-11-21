import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/Slices/authslice";
import { useNavigate, Link } from "react-router-dom";
import AuthShell from "../components/Auth/AuthShell";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    dispatch(loginUser(data)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        localStorage.removeItem("pendingVerificationEmail");
        localStorage.removeItem("registerEmail");
        navigate("/homes"); // Redirect after successful login
      } else if (res.payload?.toLowerCase().includes("verify your email")) {
        const email = data.email.trim().toLowerCase();
        localStorage.setItem("pendingVerificationEmail", email);
        localStorage.removeItem("registerEmail");
        navigate("/verify-account", { state: { email } });
      }
    });
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
            <input
              id="login-password"
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters long",
                },
              })}
              className="h-12 w-full rounded-lg border border-[#b0b0b0] px-3 text-sm text-[#222] outline-none transition placeholder:text-[#717171] focus:border-[#222] focus:ring-1 focus:ring-[#222]"
              placeholder="Enter your password"
            />
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
            {loading ? "Loading..." : "Login"}
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
