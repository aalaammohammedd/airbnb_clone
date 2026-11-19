import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

//  Register
export const registerUser = createAsyncThunk(
  "/register",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      return data;
    } catch (err) {
      console.log(err);
      return rejectWithValue(err.message);
    }
  }
);

// login
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

//  Verify email
export const verifyEmail = createAsyncThunk(
  "/verifyEmail",
  async ({ email, code }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/mail/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Verification failed");

      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


//resend verify email
export const resendVerification = createAsyncThunk(
  "/resendVerification",
  async (data, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/mail/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",

        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to resend code");
      return result;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
export const sendResetCode = createAsyncThunk(
  "/sendResetCode",
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/reset/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset code");

      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
// VERIFY RESET CODE
export const verifyResetCode = createAsyncThunk(
  "auth/verifyResetCode",
  async ({ email, code }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/reset/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired code");

      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ email, newPassword }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

//profil get data 
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'GET',
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        return rejectWithValue(data.message || 'Failed to fetch profile.');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

//profile edit data
const EDITABLE_FIELDS = [
  'profilePhoto',
  'interests',
  'aboutMe',
  'location',
];


export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const updatesToSend = {};
      for (const key of EDITABLE_FIELDS) {
        if (Object.hasOwn(profileData, key)) {
          updatesToSend[key] = profileData[key];
        }
      }

      if (Object.keys(updatesToSend).length === 0) {
        return rejectWithValue('No valid fields provided for update.');
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify(updatesToSend),
      });

      const data = await res.json();

      if (!res.ok) {
        return rejectWithValue(data.message || 'Failed to update profile.');
      }

      return data;
    } catch (error) {
      console.error("Update Profile Error:", error);
      return rejectWithValue(error.message);
    }
  }
);

//photo 
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

//photo
export const uploadProfilePhoto = createAsyncThunk(
  'auth/uploadProfilePhoto',
  async (file, { rejectWithValue }) => {
    try {
      const base64String = await convertFileToBase64(file);

      const payload = {
        base64Image: base64String,
      };
      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return rejectWithValue(data.message || 'Image upload failed.');
      }

      return data.profilePhoto;

    } catch (error) {
      console.error("Base64 Upload Error:", error);
      return rejectWithValue(error.message || 'Error during file processing.');
    }
  }
);

//booking 
// export const fetchUserBookings = createAsyncThunk(
//   'auth/fetchUserBookings',
//   // GetState allows us to access the Redux state
//   async (_, { rejectWithValue, getState }) => {
//     try {
//       const userId = getState().auth.user.id;

//       if (!userId) {
//         return rejectWithValue("User ID is missing for fetching bookings.");
//       }

//       // Endpoint  /api/bookings/:userId
//       const response = await axios.get(`/api/bookings/${userId}`);

//       return response.data.data;

//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
//     }
//   }
// );
// Fetch current user from token
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/profile`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch user");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Logout
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Logout failed");
      // Clear the token cookie
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    successMessage: null,
    resetEmail: "",
    updateError: null,
    updateStatus: 'idle',
    photoUploadStatus: 'idle',
    photoUploadError: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Registration successful!";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //  Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.successMessage = "Login successful!";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //  Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user) state.user = action.payload.user;
        state.isAuthenticated = true;
        state.successMessage = "Email verified successfully!";
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // resend verfify email
      .addCase(resendVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      .addCase(sendResetCode.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(sendResetCode.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = "Reset code sent to your email.";
        state.resetEmail = action.meta.arg.email;
      })

      .addCase(sendResetCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // VERIFY RESET CODE
      .addCase(verifyResetCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyResetCode.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message || "Code verified!";
      })
      .addCase(verifyResetCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        state.resetEmail = ""; // clear after reset
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
      })

      //update profile 

      .addCase(updateProfile.pending, (state) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateStatus = 'fulfilled';
        state.updateError = null;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.payload || 'Failed to update profile.';
      })


      .addCase(uploadProfilePhoto.pending, (state) => {
        state.photoUploadStatus = 'loading';
      })
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        state.photoUploadStatus = 'fulfilled';
        state.user.profilePhoto = action.payload;
      })
      .addCase(uploadProfilePhoto.rejected, (state, action) => {
        state.photoUploadStatus = 'failed';
        state.error = action.payload;
      })


      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.successMessage = "Logged out successfully!";
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearMessages } = authSlice.actions;
export default authSlice.reducer;