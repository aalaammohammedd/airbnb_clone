import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/Auth/AuthShell";

const registerSchema = z
  .object({
    firstName: z.string().min(3, "First name must be at least 3 characters"),
    lastName: z.string().min(3, "Last name must be at least 3 characters"),
    dob: z.string().min(1, "Date of birth is required"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/\d/, "Must contain at least one number")
      .regex(/[@$!%*?&]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const inputClassName =
  "h-[52px] w-full rounded-xl border border-[#dddddd] px-4 text-sm text-[#222] outline-none transition placeholder:text-[#999] focus:border-[#222] focus:ring-1 focus:ring-[#222]";

function FormField({ id, label, error, children }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-[#484848]">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setSubmitError("");
    const email = data.email.trim().toLowerCase();
    const registrationData = {
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
      email,
      password: data.password,
    };

    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(registrationData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }

      localStorage.setItem("pendingVerificationEmail", email);
      localStorage.removeItem("registerEmail");
      navigate("/verify-account", { state: { email } });
    } catch (error) {
      setSubmitError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="JOIN AIRBNB"
      title="Create your account"
      subtitle="A few details, then your next stay is within reach."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="register-first-name" label="First name" error={errors.firstName}>
            <input
              id="register-first-name"
              autoComplete="given-name"
              {...register("firstName")}
              className={inputClassName}
              placeholder="First name"
            />
          </FormField>
          <FormField id="register-last-name" label="Last name" error={errors.lastName}>
            <input
              id="register-last-name"
              autoComplete="family-name"
              {...register("lastName")}
              className={inputClassName}
              placeholder="Last name"
            />
          </FormField>
        </div>

        <FormField id="register-dob" label="Date of birth" error={errors.dob}>
          <input
            id="register-dob"
            type="date"
            autoComplete="bday"
            {...register("dob")}
            className={inputClassName}
          />
        </FormField>

        <FormField id="register-email" label="Email address" error={errors.email}>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className={inputClassName}
            placeholder="you@example.com"
          />
        </FormField>

        <FormField id="register-password" label="Password" error={errors.password}>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
              className={`${inputClassName} pr-12`}
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
        </FormField>

        <FormField
          id="register-confirm-password"
          label="Confirm password"
          error={errors.confirmPassword}
        >
          <div className="relative">
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={`${inputClassName} pr-12`}
              placeholder="Re-enter your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((visible) => !visible)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#717171] hover:text-[#222]"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </FormField>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        )}

        <p className="text-xs leading-5 text-[#717171]">
          By selecting Register, you agree to our{" "}
          <Link to="/help" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/help" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={loading}
          className="h-[58px] w-full rounded-xl bg-linear-to-r from-[#e61e4d] to-[#ff385c] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,56,92,0.2)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#717171]">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-[#222] underline underline-offset-2">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
};

export default RegisterPage;
