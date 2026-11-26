import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { uploadImagesToCloudinary } from "@/utils/cloudinaryUpload";

const API_URL = "http://localhost:3000/api/services";

// ============= Async thunk actions for services =================
export const getAllServices = createAsyncThunk(
  "service/getAllServices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchServices = createAsyncThunk(
  "service/searchServices",
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

export const getServiceById = createAsyncThunk(
  "service/getServiceById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createService = createAsyncThunk(
  "service/createService",
  async (serviceData, { rejectWithValue }) => {
    try {
      const images = await uploadImagesToCloudinary(serviceData.images || []);
      const response = await axios.post(
        API_URL,
        { ...serviceData, images },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateService = createAsyncThunk(
  "service/updateService",
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

export const deleteService = createAsyncThunk(
  "service/deleteService",
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

export const getHostServices = createAsyncThunk(
  "service/getHostServices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/host/my-services`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ============= Service Slice =================
const serviceSlice = createSlice({
  name: "service",
  initialState: {
    services: [],
    service: null,
    hostServices: [],
    searchResults: [],
    searchStatus: "active",
    searchTotal: 0,
    searchTotalPages: 0,
    searchCurrentPage: 1,
    status: "active",
    error: null,
  },
  reducers: {
    clearServiceError: (state) => {
      state.error = null;
    },
    clearCurrentService: (state) => {
      state.service = null;
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
      // Get all services
      .addCase(getAllServices.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getAllServices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.services = action.payload.data;
      })
      .addCase(getAllServices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(searchServices.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        const { data, total, totalPages, currentPage, page } =
          action.payload;

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
      .addCase(searchServices.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.error = action.payload;
      })
      // Get service by ID
      .addCase(getServiceById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getServiceById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.service = action.payload.data;
      })
      .addCase(getServiceById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Create service
      .addCase(createService.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.services.push(action.payload.data);
      })
      .addCase(createService.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update service
      .addCase(updateService.fulfilled, (state, action) => {
        const index = state.services.findIndex(
          (svc) => svc._id === action.payload.data._id
        );
        if (index !== -1) state.services[index] = action.payload.data;
      })
      // Delete service
      .addCase(deleteService.fulfilled, (state, action) => {
        state.services = state.services.filter(
          (svc) => svc._id !== action.payload
        );
      })
      // Get host services
      .addCase(getHostServices.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getHostServices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.hostServices = action.payload.data;
      })
      .addCase(getHostServices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearServiceError, clearCurrentService, clearSearchResults } =
  serviceSlice.actions;
export default serviceSlice.reducer;
