import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { uploadImagesToCloudinary } from "@/utils/cloudinaryUpload";

// ============= Async thunk actions for listings =================
// ------------- 1. Get all listings --------------
export const GetAllListings = createAsyncThunk(
  "listing/allListings",
  async () => {
    const response = await axios.get("/api/listings");
    return response.data;
  }
);

//------------- 2. Get a single listing by ID --------------
export const GetListingById = createAsyncThunk(
  "listing/listingById",
  async (id) => {
    const response = await axios.get(`/api/listings/${id}`);
    return response.data;
  }
);

// ------------- 6. Get Host Listings --------------
export const getHostListings = createAsyncThunk(
  "listing/getHostListings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/listings/host/my-listings", {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ------------- 3. Create a new listing --------------
export const createListing = createAsyncThunk(
  "listing/createListing",
  async (newListing, { rejectWithValue }) => {
    try {
      const images = await uploadImagesToCloudinary(newListing.images || []);
      const response = await axios.post(
        "/api/listings",
        { ...newListing, images },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ------------- 4. Update an existing listing --------------
export const updateListing = createAsyncThunk(
  "listing/updateListing",
  async (updatedListing, { rejectWithValue }) => {
    try {
      const { id, ...payload } = updatedListing;
      const response = await axios.put(`/api/listings/${id}`, payload, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ------------- 5. Delete a listing --------------
export const deleteListing = createAsyncThunk(
  "listing/deleteListing",
  async (id) => {
    const response = await axios.delete(`/api/listings/${id}`);
    return response.data;
  }
);

// ------------- 6. Search listings --------------
export const searchListings = createAsyncThunk(
  "listing/searchListings",
  async (searchParams) => {
    const queryString = new URLSearchParams(searchParams).toString();
    const response = await axios.get(`/api/listings/search?${queryString}`);
    return response.data;
  }
);

//============ Listing Slice =================
const listingSlice = createSlice({
  name: "listingSlice",
  initialState: {
    listings: [],
    hostListings: [],
    listing: null,
    searchResults: [],
    searchMetadata: null,
    status: "idle",
    error: null,
  },
  //extraReducers for async thunks
  extraReducers: (builder) => {
    builder
      // ------------- 1. Get all listings --------------
      .addCase(GetAllListings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(GetAllListings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.listings = action.payload.data || action.payload;
      })
      .addCase(GetAllListings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      // ------------- 2. Get a single listing by ID --------------
      .addCase(GetListingById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(GetListingById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.listing = action.payload;
      })
      .addCase(GetListingById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      // ------------- 3. Create a new listing --------------
      .addCase(createListing.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createListing.fulfilled, (state, action) => {
        state.listings.push(action.payload);
      })

      // ------------- 4. Update an existing listing --------------
      .addCase(updateListing.fulfilled, (state, action) => {
        const i = state.listings.findIndex((l) => l.id === action.payload.id);
        if (i !== -1) state.listings[i] = action.payload;
      })

      // ------------- 5. Delete a listing --------------
      .addCase(deleteListing.fulfilled, (state, action) => {
        state.listings = state.listings.filter((l) => l.id !== action.payload);
        state.hostListings = state.hostListings.filter((l) => l._id !== action.payload.toString()); // Update host listings too
      })

      // ------------- 6. Search listings --------------
      .addCase(searchListings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(searchListings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.searchResults = action.payload.items;
        state.searchMetadata = action.payload.search_metadata;
      })
      .addCase(searchListings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      // ------------- 7. Get Host Listings --------------
      .addCase(getHostListings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getHostListings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.hostListings = action.payload; // populate only hostListings
      })
      .addCase(getHostListings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default listingSlice.reducer;
