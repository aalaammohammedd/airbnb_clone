import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { sendResetCode } from "../store/Slices/authslice";
import { Link } from "react-router-dom";
import { useState } from "react";
import VerifyCodePopup from "../components/User/VerifyCodePopup";
import AuthShell from "../components/Auth/AuthShell";

export default function ForgetPassword() {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((state) => state.auth);
  const [openVerifyPopup, setOpenVerifyPopup] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const res = await dispatch(sendResetCode({ email: data.email }));

    if (res.meta.requestStatus === "fulfilled") {
      setOpenVerifyPopup(true);
    }
  };

  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title="Forgot password?"
      subtitle="Enter your email address and we’ll send you a reset code."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="reset-email" className="block text-sm font-medium text-[#484848]">
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email address",
              },
            })}
            className="h-[52px] w-full rounded-xl border border-[#dddddd] px-4 text-sm text-[#222] outline-none transition placeholder:text-[#999] focus:border-[#222] focus:ring-1 focus:ring-[#222]"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-[58px] w-full rounded-xl bg-gradient-to-r from-[#e61e4d] to-[#ff385c] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,56,92,0.2)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending code..." : "Send reset code"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#717171]">
        Remember your password?{" "}
        <Link to="/login" className="font-semibold text-[#222] underline underline-offset-2">
          Log in
        </Link>
      </p>

      {openVerifyPopup && (
        <VerifyCodePopup onClose={() => setOpenVerifyPopup(false)} />
      )}
    </AuthShell>
  );
}
