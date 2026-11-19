import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserProfile,
  resendVerification,
  verifyEmail,
} from "../../store/Slices/authslice";
import { useNavigate } from "react-router-dom";

const RESEND_DELAY_SECONDS = 30;

export default function VerifyEmail({ isOpen = true, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const savedEmail = localStorage.getItem("registerEmail");
  const [resendCountdown, setResendCountdown] = useState(RESEND_DELAY_SECONDS);
  const [activeAction, setActiveAction] = useState(null);
  const activeActionRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;
    const timer = window.setTimeout(
      () => setResendCountdown((seconds) => seconds - 1),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const onSubmit = async ({ verificationCode }) => {
    if (activeActionRef.current) return;
    activeActionRef.current = true;
    setActiveAction("verify");
    try {
      await dispatch(
        verifyEmail({ email: savedEmail, code: verificationCode })
      ).unwrap();
      await dispatch(fetchUserProfile()).unwrap();
      localStorage.removeItem("registerEmail");
      onClose?.();
      navigate("/homes", { replace: true });
    } catch {
      // The rejected thunk exposes its message through the auth slice.
    } finally {
      activeActionRef.current = false;
      setActiveAction(null);
    }
  };

  const handleResend = async () => {
    if (activeActionRef.current) return;
    activeActionRef.current = true;
    setActiveAction("resend");
    try {
      await dispatch(resendVerification({ email: savedEmail })).unwrap();
      setResendCountdown(RESEND_DELAY_SECONDS);
    } catch {
      // The rejected thunk exposes its message through the auth slice.
    } finally {
      activeActionRef.current = false;
      setActiveAction(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-email-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
          aria-label="Close verification dialog"
        >
          ×
        </button>

        <h2 id="verify-email-title" className="text-2xl font-semibold text-center mb-3">
          Verify Your Email
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter the six-character code we sent to {savedEmail}.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="verificationCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Verification Code
            </label>
            <input
              id="verificationCode"
              type="text"
              autoComplete="one-time-code"
              maxLength={6}
              disabled={loading || activeAction !== null}
              {...register("verificationCode", {
                required: "Verification code is required",
                pattern: {
                  value: /^[a-fA-F0-9]{6}$/,
                  message: "Enter the six-character code from your email",
                },
              })}
              className="w-full p-2 border rounded-md text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              placeholder="ABC123"
            />
            {errors.verificationCode && (
              <p className="text-red-500 text-sm mt-1" role="alert">
                {errors.verificationCode.message}
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || activeAction !== null}
            className="w-full bg-[#ff385c] hover:bg-[#e61e4d] text-white py-2 rounded-md transition duration-200 disabled:opacity-50"
          >
            {activeAction === "verify" || loading
              ? "Verifying..."
              : "Verify Account"}
          </button>
        </form>

        <div className="text-sm text-center mt-4">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || activeAction !== null || resendCountdown > 0}
            className="text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {activeAction === "verify"
              ? "Verifying..."
              : activeAction === "resend"
                ? "Sending..."
                : resendCountdown > 0
                  ? `Resend code in ${resendCountdown}s`
                  : "Resend Code"}
          </button>
        </div>
      </div>
    </div>
  );
}
