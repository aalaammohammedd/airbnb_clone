import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { BadgeCheck, Check, Image, LockKeyhole, Pencil } from "lucide-react";
import { setProfile, fetchUserProfile } from "../store/Slices/authslice";
import { apiUrl } from "../utils/api";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";

const inputClassName =
  "mt-2 h-11 w-full rounded-lg border border-[#b0b0b0] px-3 text-sm text-[#222] outline-none focus:border-[#222] focus:ring-1 focus:ring-[#222]";

const formatDate = (dateValue, options) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-US", options).format(date);
};

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user: profile, loading, error } = useSelector((state) => state.auth);
  const photoInputRef = useRef(null);
  const [editingField, setEditingField] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [emailUpdatePending, setEmailUpdatePending] = useState(false);

  useEffect(() => {
    if (!profile && !loading && !error) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, profile, loading, error]);

  const beginEditing = (field) => {
    setUpdateError("");
    setEmailUpdatePending(false);
    setEditingField(field);
    setFormValues({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      dob: profile.dob || "",
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!editingField || isSaving) return;

    const update =
      editingField === "fullName"
        ? { firstName: formValues.firstName.trim(), lastName: formValues.lastName.trim() }
        : { [editingField]: formValues[editingField].trim() };

    setIsSaving(true);
    setUpdateError("");
    try {
      const response = await fetch(apiUrl("profile"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(update),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update profile.");
      }

      const emailChanged = update.email && update.email !== profile.email;
      dispatch(setProfile(result));
      setEmailUpdatePending(Boolean(emailChanged));
      setEditingField(null);
    } catch (requestError) {
      setUpdateError(requestError.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isUploadingPhoto) return;

    setIsUploadingPhoto(true);
    setUpdateError("");
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      const response = await fetch(apiUrl("profile/upload"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrl }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to save profile photo.");
      }

      dispatch(setProfile({ ...profile, profilePhoto: result.profilePhoto }));
    } catch (requestError) {
      setUpdateError(requestError.message || "Failed to upload profile photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  const initials = [profile?.firstName, profile?.lastName]
    .map((name) => name?.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .join("");
  const role = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "";
  const joinedDate = formatDate(profile?.createdAt, { month: "long", year: "numeric" });

  const renderEditForm = (field) => {
    if (editingField !== field) return null;

    return (
      <form onSubmit={handleSave} className="mt-4">
        {field === "fullName" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-[#484848]">
              First name
              <input
                autoComplete="given-name"
                className={inputClassName}
                minLength={3}
                required
                value={formValues.firstName}
                onChange={(event) =>
                  setFormValues((values) => ({ ...values, firstName: event.target.value }))
                }
              />
            </label>
            <label className="text-sm font-medium text-[#484848]">
              Last name
              <input
                autoComplete="family-name"
                className={inputClassName}
                minLength={3}
                required
                value={formValues.lastName}
                onChange={(event) =>
                  setFormValues((values) => ({ ...values, lastName: event.target.value }))
                }
              />
            </label>
          </div>
        ) : (
          <label htmlFor={`profile-${field}`} className="sr-only">
            {field === "dob" ? "Date of birth" : field}
          </label>
        )}
        {field !== "fullName" && (
          <input
            id={`profile-${field}`}
            autoComplete={
              field === "email" ? "email" : field === "phone" ? "tel" : "bday"
            }
            className={inputClassName}
            type={field === "dob" ? "date" : field === "email" ? "email" : "text"}
            inputMode={field === "phone" ? "tel" : undefined}
            placeholder={field === "phone" ? "+14155550138" : undefined}
            required={field !== "phone"}
            value={formValues[field] || ""}
            onChange={(event) =>
              setFormValues((values) => ({ ...values, [field]: event.target.value }))
            }
          />
        )}
        {field === "phone" && (
          <p className="mt-2 text-xs text-[#717171]">
            Include your country code and enter digits only, for example +14155550138.
          </p>
        )}
        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-[#222] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              setEditingField(null);
              setUpdateError("");
            }}
            className="rounded-lg border border-[#b0b0b0] px-5 py-2.5 text-sm font-semibold text-[#222] hover:border-[#222]"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  const renderProfileRow = (field, label, value, description) => (
    <section key={field} className="border-b border-[#ebebeb] py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#222]">{label}</h2>
          <p className="mt-1 text-sm text-[#484848]">{value || "Not provided"}</p>
          {description && <p className="mt-1 text-xs text-[#717171]">{description}</p>}
        </div>
        {editingField !== field && (
          <button
            type="button"
            onClick={() => beginEditing(field)}
            className="shrink-0 text-sm font-semibold text-[#222] underline underline-offset-2 hover:text-[#717171]"
          >
            <Pencil aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>
      {renderEditForm(field)}
    </section>
  );

  if (loading) {
    return <p className="mx-auto max-w-5xl px-6 py-16 text-center text-[#717171]">Loading profile...</p>;
  }
  if (error) {
    return (
      <p className="mx-auto max-w-5xl px-6 py-16 text-center text-red-600" role="alert">
        Unable to load your profile: {error}
      </p>
    );
  }
  if (!profile) {
    return <p className="mx-auto max-w-5xl px-6 py-16 text-center text-[#717171]">No profile data available.</p>;
  }

  return (
    <main className="mx-auto my-10 max-w-5xl px-5 sm:px-8">
      <header className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-[#222] sm:text-[30px]">
          Personal information
        </h1>
        <p className="mt-2 text-sm text-[#717171]">
          Manage your personal details and how we can reach you.
        </p>
      </header>


      <div className="grid gap-8 md:grid-cols-[230px_minmax(0,1fr)] md:gap-10">
        <aside>
          <div className="rounded-xl border border-[#ebebeb] bg-white p-6 text-center shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleProfilePhotoChange}
              aria-label="Choose a profile photo"
            />
            <button
              type="button"
              disabled={isUploadingPhoto}
              onClick={() => photoInputRef.current?.click()}
              aria-label={isUploadingPhoto ? "Uploading profile photo" : "Upload profile photo"}
              className="group relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#315f5b] text-2xl font-semibold text-white disabled:cursor-wait"
            >
              {profile.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || "U"
              )}
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 text-[10px] font-semibold leading-tight opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {isUploadingPhoto ? (
                  "Uploading..."
                ) : (
                  <>
                    <Image aria-hidden="true" className="h-4 w-4" />
                    Upload photo
                  </>
                )}
              </span>
            </button>
            <h2 className="mt-4 text-lg font-semibold text-[#222]">{fullName || "User"}</h2>
            {role && <p className="mt-1 text-sm text-[#717171]">{role}</p>}

            {profile.isVerified && (
              <div className="mt-6 border-t border-[#ebebeb] pt-5 text-left">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#222]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#222] text-white">
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                  Identity verified
                </div>
                <p className="ml-7 mt-1 text-xs text-[#717171]">
                  Your account has been verified.
                </p>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-[#ebebeb] pt-4 text-xs">
              <span className="text-[#717171]">Member since</span>
              <span className="font-semibold text-[#222]">{joinedDate || "—"}</span>
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-[#f7f7f7] px-4 py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#ff385c]">
              <LockKeyhole aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#222]">Your information is private</p>
              <p className="mt-0.5 text-xs text-[#717171]">
                Only you can see the personal details on this page.
              </p>
            </div>
          </div>

          {updateError && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {updateError}
            </p>
          )}
          {emailUpdatePending && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              Your email changed. Verify the new address to confirm your account.{" "}
              <Link
                to="/verify-account"
                state={{ email: profile.email }}
                className="font-semibold underline underline-offset-2"
              >
                Verify email
              </Link>
            </p>
          )}

          {renderProfileRow(
            "fullName",
            "Full name",
            fullName,
            "This is the name on your travel documents."
          )}
          {renderProfileRow(
            "email",
            "Email address",
            profile.email,
            "Used for booking confirmations and account updates."
          )}
          {renderProfileRow(
            "phone",
            "Phone number",
            profile.phone,
            "For trip updates and account security."
          )}
          {renderProfileRow(
            "dob",
            "Date of birth",
            formatDate(profile.dob, {
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            }),
            "Your date of birth is private."
          )}

          {profile.isVerified && (
            <section className="border-b border-[#ebebeb] py-5">
              <h2 className="text-sm font-semibold text-[#222]">Account verification</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-[#315f5b]">
                <BadgeCheck aria-hidden="true" className="h-4 w-4" />
                Identity verified
              </p>
              <p className="mt-1 text-xs text-[#717171]">
                Your account has been successfully confirmed.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
