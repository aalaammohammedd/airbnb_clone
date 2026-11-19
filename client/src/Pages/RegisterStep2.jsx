import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../store/Slices/authslice";
import { useNavigate } from "react-router-dom";

const registerSchema = z
  .object({
    firstName: z.string().min(3, "First name must be at least 3 characters"),
    lastName: z.string().min(3, "Last name must be at least 3 characters"),
    dob: z.string().min(1, "Date of birth is required"),
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

const RegisterStep2 = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const savedEmail = localStorage.getItem("registerEmail");

  useEffect(() => {
    if (!savedEmail) navigate("/signup");
  }, [savedEmail, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data) => {
    const fullData = {
      email: savedEmail,
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
      password: data.password,
    };

    dispatch(registerUser(fullData))
      .unwrap()
      .then(() => navigate("/homes", { state: { showVerifyEmail: true } }))
      .catch(() => {});
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl m-10">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Finish signing up
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <h3>Legal name</h3>
          {/* Group Container for First Name and Last Name */}
          <div className="space-y-0">

            {/* First Name*/}
            <div className="mb-0">
              <input
                type="text"
                {...register("firstName")}
                className="w-full px-3 py-2 border border-b-0 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name*/}
            <div className="mb-0">
              <input
                type="text"
                {...register("lastName")}
                className="w-full px-3 py-2 border rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
            <span className="text-xs">Make sure this matches the name on your government ID. If you go by another name, you can add a preferred first name.</span>
          </div>

          {/* DOB */}
          <div>
            <label className="block text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              {...register("dob")}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.dob && (
              <p className="text-red-500 text-sm mt-1">{errors.dob.message}</p>
            )}
            <span className="text-xs">To sign up, you need to be at least 18. Your birthday won’t be shared with other people who use Airbnb.</span>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={savedEmail || ""}
              readOnly
              className="w-full px-3 py-2 border bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed"
            />
            <span className="text-xs">We'll email you trip confirmations and receipts.</span>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              {...register("confirmPassword")}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Confirm password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm" role="alert">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-2 rounded-lg transition duration-200 ${loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-[#ff385c] hover:bg-[#e61e4d]"
              }`}
          >
            {loading ? "Loading..." : "Agree & Continue"}
          </button>
        </form>
      </div>
    </div>

  );
};

export default RegisterStep2;