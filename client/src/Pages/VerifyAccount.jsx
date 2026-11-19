import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  fetchUserProfile,
  resendVerification,
  verifyEmail,
} from "../store/Slices/authslice";

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
      const result = await dispatch(resendVerification({ email })).unwrap();
      setCodeSent(true);
      setResendCountdown(result.resendAfterSeconds || RESEND_DELAY_SECONDS);
      setSuccessMessage(result.message);
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
      await dispatch(
        verifyEmail({ email, code: verificationCode.trim().toLowerCase() })
      ).unwrap();
      await dispatch(fetchUserProfile()).unwrap();
      localStorage.removeItem("pendingVerificationEmail");
      localStorage.removeItem("registerEmail");
      navigate("/homes", { replace: true });
    } catch (error) {
      setActionError(
        typeof error === "string" ? error : "Account verification failed"
      );
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gray-100 px-4 py-10">
      <section
        className="w-full max-w-md rounded-2xl border border-[#717171] bg-white p-8"
        aria-labelledby="verify-account-title"
      >
        <h1
          id="verify-account-title"
          className="mb-3 text-center text-2xl font-semibold"
        >
          Verify your account
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          We&apos;ll send a six-character verification code to {email}.
        </p>

        {!codeSent ? (
          <button
            type="button"
            onClick={handleSendCode}
            disabled={activeAction !== null}
            className="w-full rounded-md bg-[#ff385c] py-2 text-white transition duration-200 hover:bg-[#e61e4d] disabled:opacity-50"
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
                  className="w-full rounded-md border p-2 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
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
                className="w-full rounded-md bg-[#ff385c] py-2 text-white transition duration-200 hover:bg-[#e61e4d] disabled:opacity-50"
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
      </section>
    </main>
  );
}
