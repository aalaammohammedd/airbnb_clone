import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { fetchUserProfile } from "../store/Slices/authslice";
import AuthShell from "../components/Auth/AuthShell";

const RESEND_DELAY_SECONDS = 30;

export default function VerifyAccount() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const email =
    location.state?.email ||
    localStorage.getItem("pendingVerificationEmail") ||
    localStorage.getItem("registerEmail");
  const [codeSent, setCodeSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [activeAction, setActiveAction] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");

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

  if (!email) return <Navigate to="/signup" replace />;

  const handleSendCode = async () => {
    if (activeAction) return;
    setActiveAction("send");
    setSuccessMessage("");
    setActionError("");
    try {
      const response = await fetch("/api/mail/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        const resendError = new Error(
          result.message || "Failed to send verification code"
        );
        resendError.resendAfterSeconds = result.resendAfterSeconds;
        throw resendError;
      }
      setCodeSent(true);
      setResendCountdown(result.resendAfterSeconds || RESEND_DELAY_SECONDS);
      setSuccessMessage(result.message || "Verification code sent successfully");
    } catch (error) {
      if (error?.resendAfterSeconds) {
        setCodeSent(true);
        setResendCountdown(error.resendAfterSeconds);
      }
      setActionError(
        typeof error === "string"
          ? error
          : error?.message || "Failed to send verification code"
      );
    } finally {
      setActiveAction(null);
    }
  };

  const onSubmit = async ({ verificationCode }) => {
    if (activeAction) return;
    setActiveAction("verify");
    setActionError("");
    try {
      const response = await fetch("/api/mail/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          code: verificationCode.trim().toLowerCase(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Account verification failed");
      }
      await dispatch(fetchUserProfile()).unwrap();
      localStorage.removeItem("pendingVerificationEmail");
      localStorage.removeItem("registerEmail");
      navigate("/homes", { replace: true });
    } catch (error) {
      setActionError(
        typeof error === "string"
          ? error
          : error?.message || "Account verification failed"
      );
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <AuthShell
      eyebrow="ONE LAST STEP"
      title="Verify your account"
      subtitle={`We’ll send a six-character code to ${email}`}
    >

        {!codeSent ? (
          <button
            type="button"
            onClick={handleSendCode}
            disabled={activeAction !== null}
            className="h-12 w-full rounded-lg bg-[#ff385c] text-sm font-semibold text-white transition hover:bg-[#e61e4d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {activeAction === "send" ? "Sending code..." : "Send code"}
          </button>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="verificationCode"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Verification code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  autoComplete="one-time-code"
                  maxLength={6}
                  disabled={activeAction !== null}
                  {...register("verificationCode", {
                    required: "Verification code is required",
                    pattern: {
                      value: /^[a-fA-F0-9]{6}$/,
                      message: "Enter the six-character code from your email",
                    },
                  })}
                  className="h-12 w-full rounded-lg border border-[#b0b0b0] px-3 text-center text-lg uppercase tracking-[0.35em] outline-none focus:border-[#222] focus:ring-1 focus:ring-[#222] disabled:opacity-50"
                  placeholder="ABC123"
                />
                {errors.verificationCode && (
                  <p className="mt-1 text-sm text-red-500" role="alert">
                    {errors.verificationCode.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={activeAction !== null}
                className="h-12 w-full rounded-lg bg-[#ff385c] text-sm font-semibold text-white transition hover:bg-[#e61e4d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeAction === "verify" ? "Verifying..." : "Verify account"}
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={handleSendCode}
                disabled={
                  activeAction !== null || resendCountdown > 0
                }
                className="text-blue-600 hover:underline disabled:no-underline disabled:opacity-50"
              >
                {activeAction === "send"
                  ? "Sending..."
                  : resendCountdown > 0
                    ? `Resend code in ${resendCountdown}s`
                    : "Resend code"}
              </button>
            </div>
          </>
        )}

        {(actionError || successMessage) && (
          <p
            className={`mt-4 text-center text-sm ${
              actionError ? "text-red-600" : "text-green-600"
            }`}
            role="status"
          >
            {actionError || successMessage}
          </p>
        )}
    </AuthShell>
  );
}
