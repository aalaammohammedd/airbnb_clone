import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/Slices/authslice";
import { useNavigate, Link } from "react-router-dom";

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl border border-[#717171] w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Welcome</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email",
                },
              })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Email"
            />

            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters long",
                },
              })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm" role="alert">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff385c] hover:bg-[#e61e4d] text-white py-2 rounded-md transition duration-200 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>

        {/* Links */}
        <div className="text-sm text-center mt-4 space-y-1">
          <p>
            Not You?{" "}
            <Link to="/signup" className="text-black text-xs underline">
              Use another account
            </Link>
          </p>
          <p>
            <Link to="/forget-password" className="text-black text-xs underline">
              Forgot Password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
