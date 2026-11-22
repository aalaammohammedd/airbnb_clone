import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Profile fetching stays in Redux so shared profile consumers use one source of truth.
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
      return rejectWithValue(error.message || 'Failed to fetch profile.');
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
    resetEmail: "",
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setProfile: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    setResetEmail: (state, action) => {
      state.resetEmail = action.payload;
    },
    clearResetEmail: (state) => {
      state.resetEmail = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const {
  logout,
  setProfile,
  setResetEmail,
  clearResetEmail,
} = authSlice.actions;
export default authSlice.reducer;