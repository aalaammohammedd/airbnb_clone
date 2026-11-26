import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { uploadImagesToCloudinary } from "@/utils/cloudinaryUpload";

const API_URL = "http://localhost:3000/api/experiences";

// ============= Async thunk actions for experiences =================
export const getAllExperiences = createAsyncThunk(
  "experience/getAllExperiences",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Search experiences with pagination
export const searchExperiences = createAsyncThunk(
  "experience/searchExperiences",
  async (
    {
      city,
      date,
      guests,
      page = 1,
      limit = 10,
      priceRange,
      categories,
      minRating,
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (city) params.append("city", city);
      if (date) params.append("date", date);
      if (guests) params.append("guests", guests);
      params.append("page", page);
      params.append("limit", limit);

      if (priceRange) params.append("priceRange", JSON.stringify(priceRange));
      if (categories && categories.length > 0)
        params.append("categories", JSON.stringify(categories));
      if (minRating) params.append("minRating", minRating);

      const response = await axios.get(`${API_URL}?${params.toString()}`);
      return { ...response.data, page };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getExperienceById = createAsyncThunk(
  "experience/getExperienceById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createExperience = createAsyncThunk(
  "experience/createExperience",
  async (experienceData, { rejectWithValue }) => {
    try {
      const images = await uploadImagesToCloudinary(experienceData.images || []);
      const response = await axios.post(
        API_URL,
        { ...experienceData, images },
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateExperience = createAsyncThunk(
  "experience/updateExperience",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteExperience = createAsyncThunk(
  "experience/deleteExperience",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${id}`, {
        withCredentials: true,
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getHostExperiences = createAsyncThunk(
  "experience/getHostExperiences",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/host/my-experiences`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ============= Experience Slice =================
const experienceSlice = createSlice({
  name: "experience",
  initialState: {
    experiences: [],
    experience: null,
    hostExperiences: [],
    searchResults: [],
    searchStatus: "active",
    searchTotal: 0,
    searchTotalPages: 0,
    searchCurrentPage: 1,
    status: "idle",
    error: null,
  },
  reducers: {
    clearExperienceError: (state) => {
      state.error = null;
    },
    clearCurrentExperience: (state) => {
      state.experience = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchTotal = 0;
      state.searchTotalPages = 0;
      state.searchCurrentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all experiences
      .addCase(getAllExperiences.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getAllExperiences.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.experiences = action.payload.data;
      })
      .addCase(getAllExperiences.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Search experiences
      .addCase(searchExperiences.pending, (state) => {
        state.searchStatus = "loading";
      })
      .addCase(searchExperiences.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        const { data, total, totalPages, currentPage, page } = action.payload;

        // If it's page 1, replace results. Otherwise, append.
        if (page === 1) {
          state.searchResults = data || [];
        } else {
          state.searchResults = [...state.searchResults, ...(data || [])];
        }
        state.searchTotal = total || 0;
        state.searchTotalPages = totalPages || 0;
        state.searchCurrentPage = currentPage || page;
      })
      .addCase(searchExperiences.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.error = action.payload;
      })
      // Get experience by ID
      .addCase(getExperienceById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getExperienceById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.experience = action.payload.data;
      })
      .addCase(getExperienceById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Create experience
      .addCase(createExperience.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createExperience.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.experiences.push(action.payload.data);
      })
      .addCase(createExperience.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update experience
      .addCase(updateExperience.fulfilled, (state, action) => {
        const index = state.experiences.findIndex(
          (exp) => exp._id === action.payload.data._id
        );
        if (index !== -1) state.experiences[index] = action.payload.data;
      })
      // Delete experience
      .addCase(deleteExperience.fulfilled, (state, action) => {
        state.experiences = state.experiences.filter(
          (exp) => exp._id !== action.payload
        );
      })
      // Get host experiences
      .addCase(getHostExperiences.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getHostExperiences.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.hostExperiences = action.payload.data;
      })
      .addCase(getHostExperiences.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  clearExperienceError,
  clearCurrentExperience,
  clearSearchResults,
} = experienceSlice.actions;
export default experienceSlice.reducer;
