const Listing = require("../models/Listing.model");
const Amenities = require("../models/Amenities.model");
const { validateCloudinaryImageUrls } = require("../config/cloudinary");

const parseIfString = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const getImageUrls = (images, userId) => {
  const parsedImages = parseIfString(images || []);
  return validateCloudinaryImageUrls(parsedImages, userId);
};
// Create new listing
const createListing = async (req, res) => {
  try {
    const hostId = req.user.id;

    // Structured request fields may arrive as JSON strings or parsed JSON values.
    const {
      title,
      description,
      propertyType,
      pricePerNight,
      maxGuests,
      cleaningFee,
      bedrooms,
      bathrooms,
      amenities,
      street,
      city,
      country,
      coordinates,
      availability,
      caption,
    } = req.body;

    // Required fields check (parse numbers)
    if (
      !title ||
      !description ||
      !propertyType ||
      !pricePerNight ||
      !maxGuests
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Convert string fields to correct types
    const parsedAmenities = parseIfString(amenities) || [];
    const parsedCoordinates = parseIfString(coordinates) || {};
    const parsedAvailability = parseIfString(availability) || [];

    const parsedPricePerNight = Number(pricePerNight);
    const parsedMaxGuests = Number(maxGuests);
    const parsedCleaningFee = cleaningFee ? Number(cleaningFee) : 0;
    const parsedBedrooms = bedrooms ? Number(bedrooms) : 1;
    const parsedBathrooms = bathrooms ? Number(bathrooms) : 1;

    // Validate amenities
    let validAmenities = [];
    if (parsedAmenities.length > 0) {
      validAmenities = await Amenities.find({
        _id: { $in: parsedAmenities },
      });
    }

    const uploadedImages = getImageUrls(req.body.images, hostId).map((url) => ({
      url,
      caption: caption || "Listing photo",
    }));

    // Format availability
    const formattedAvailability = parsedAvailability.map((range) => {
      if (Array.isArray(range)) {
        return { startDate: new Date(range[0]), endDate: new Date(range[1]) };
      }

      const date = new Date(range);
      return { startDate: date, endDate: date };
    });

    const newListing = new Listing({
      title,
      description,
      propertyType,
      pricePerNight: parsedPricePerNight,
      maxGuests: parsedMaxGuests,
      cleaningFee: parsedCleaningFee,
      bedrooms: parsedBedrooms,
      bathrooms: parsedBathrooms,
      amenities: validAmenities.map((a) => a._id),
      hostId,
      images: uploadedImages,
      address: { street, city, country, coordinates: parsedCoordinates },
      availability: formattedAvailability,
    });

    await newListing.save();
    return res.status(201).json(newListing);
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Get all listings
const getListings = async (req, res) => {
  try {
    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const propertyType = req.query.propertyType || '';

    // Build query
    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } }
      ];
    }

    // Add property type filter
    if (propertyType) {
      query.propertyType = propertyType;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Listing.countDocuments(query);

    // Get listings with pagination
    const listings = await Listing.find(query)
      .populate("hostId", "firstName lastName _id") // join user info
      .populate("amenities", "name") // join amenities
      .populate("reviews", "rating comment") // join reviews
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    // Calculate average rating and review count for each listing
    const listingsWithStats = listings.map(listing => {
      const listingObj = listing.toObject();
      const reviews = listingObj.reviews || [];
      const reviewCount = reviews.length;
      const ratingAvg = reviewCount > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
        : 0;
      
      return {
        ...listingObj,
        reviewCount,
        ratingAvg: parseFloat(ratingAvg.toFixed(1))
      };
    });

    res.status(200).json({
      success: true,
      data: listingsWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single listing by ID
const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id)
      .populate(
        "hostId",
        "firstName lastName profilePhoto email createdAt role listings"
      )
      .populate("amenities", "name")
      .populate("reviews");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // -------------- this section is to calculate host stats --------------
    // Calculate host stats
    if (listing.hostId) {
      const hostListings = listing.hostId.listings || [];

      // Get all reviews for host's listings
      const Review = require("../models/Review.model");
      const hostReviews = await Review.find({
        listingId: { $in: hostListings },
      });

      // Calculate average rating and review count
      const totalReviews = hostReviews.length;
      const avgRating =
        totalReviews > 0
          ? (
            hostReviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          ).toFixed(2)
          : 0;

      // Calculate years hosting
      const yearsHosting = Math.floor(
        (Date.now() - new Date(listing.hostId.createdAt)) /
        (365.25 * 24 * 60 * 60 * 1000)
      );

      // Add host stats to response
      listing._doc.hostStats = {
        totalReviews,
        avgRating: parseFloat(avgRating),
        yearsHosting,
        isSuperhost:
          listing.hostId.role === "host" || listing.hostId.role === "main-host",
      };
    }

    res.status(200).json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update listing
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    //check if he is the host of the listing not guest [authentication]
    if (listing.hostId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this listing" });
    }

    /* ---------- REMOVE IMAGES ---------- */
    if (req.body.removedImages) {
      const parsedRemovedImages = parseIfString(req.body.removedImages);
      const removedImages = Array.isArray(parsedRemovedImages)
        ? parsedRemovedImages
        : [];
      listing.images = listing.images.filter(
        img => !removedImages.includes(img._id.toString())
      );
    }

    /* ---------- ADD NEW IMAGES ---------- */
    if (req.body.images !== undefined) {
      const newImageUrls = getImageUrls(req.body.images, req.user.id);
      listing.images.push(
        ...newImageUrls.map((url) => ({ url, caption: "Listing photo" }))
      );
    }

    /* ---------- UPDATE OTHER FIELDS ---------- */
    [
      "title",
      "description",
      "propertyType",
    ].forEach(field => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });

    const numberFields = [
      "pricePerNight",
      "maxGuests",
      "bedrooms",
      "bathrooms",
      "cleaningFee",
    ];

    numberFields.forEach(field => {
      if (req.body[field] !== undefined) {
        listing[field] = Number(req.body[field]);
      }
    });


    /* ---------- ADDRESS ---------- */
    if (!listing.address) listing.address = {};

    if (req.body.street !== undefined)
      listing.address.street = req.body.street;

    if (req.body.city !== undefined)
      listing.address.city = req.body.city;

    if (req.body.country !== undefined)
      listing.address.country = req.body.country;

    if (req.body.coordinates !== undefined) {
      listing.address.coordinates = parseIfString(req.body.coordinates);
    }


    /* ---------- AMENITIES ---------- */
    if (req.body.amenities) {
      const parsedAmenities = parseIfString(req.body.amenities);

      const validAmenities = await Amenities.find({
        _id: { $in: parsedAmenities },
      });

      listing.amenities = validAmenities.map(a => a._id);
    }


    /* ---------- AVAILABILITY ---------- */
    if (req.body.availability) {
      const parsedAvailability = parseIfString(req.body.availability);

      listing.availability = parsedAvailability.map(range => {
        if (Array.isArray(range)) {
          return {
            startDate: new Date(range[0]),
            endDate: new Date(range[1]),
          };
        }
        const date = new Date(range);
        return { startDate: date, endDate: date };
      });
    }

    await listing.save();
    res.status(200).json(listing);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

// const updateListing = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const listing = await Listing.findById(id);
//     if (!listing) {
//       return res.status(404).json({ message: "Listing not found" });
//     }

//     //check if he is the host of the listing not guest [authentication]
//     if (listing.hostId.toString() !== req.user.id) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to update this listing" });
//     }

//     // Update the listing
//     const updatedListing = await Listing.findByIdAndUpdate(id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json(updatedListing);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// Delete listing
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.id;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.hostId.toString() !== hostId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this listing" });
    }

    await Listing.findByIdAndDelete(id);

    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search listings
const searchListings = async (req, res) => {
  // Extract query parameters and validate them if they are valid
  const {
    address,
    location_search,
    date_picker_type,
    monthly_start_date,
    monthly_end_date,
    monthly_length,
    checkin,
    checkout,
    adults = 0,
    children = 0,
    infants = 0,
    pets = 0,
    min_price,
    max_price,
    property_type_id,
    room_types,
    min_bedrooms,
    min_bathrooms,
    amenities,
    sortBy,
    search_type,
    refinement_paths,
  } = req.query;

  // Calculate total guests
  const totalGuests =
    parseInt(adults || 0) + parseInt(children || 0) + parseInt(infants || 0);

  // Validate numeric parameters
  if (min_price && isNaN(parseInt(min_price))) {
    return res.status(400).json({ message: "Invalid min_price parameter" });
  }

  if (max_price && isNaN(parseInt(max_price))) {
    return res.status(400).json({ message: "Invalid max_price parameter" });
  }

  if (min_bedrooms && isNaN(parseInt(min_bedrooms))) {
    return res.status(400).json({ message: "Invalid min_bedrooms parameter" });
  }

  if (min_bathrooms && isNaN(parseInt(min_bathrooms))) {
    return res.status(400).json({ message: "Invalid min_bathrooms parameter" });
  }

  if (min_price && max_price && parseInt(min_price) > parseInt(max_price)) {
    return res.status(400).json({
      message: "min_price must be less than or equal to max_price",
    });
  }

  // Build MongoDB Query Object
  const query = {};

  // Location search
  if (address || location_search) {
    query.address = address || location_search;
  }

  // Date filtering - handle both monthly stays and regular stays
  if (date_picker_type === "monthly_stay") {
    if (monthly_start_date && monthly_end_date) {
      query.available_dates = {
        $gte: new Date(monthly_start_date),
        $lte: new Date(monthly_end_date),
      };
    }
  } else {
    if (checkin && checkout) {
      query.available_dates = {
        $gte: new Date(checkin),
        $lte: new Date(checkout),
      };
    }
  }

  // Guest capacity
  if (totalGuests > 0) {
    query.maxGuests = { $gte: totalGuests };
  }

  // Price filtering
  if (min_price) query.pricePerNight = { $gte: parseInt(min_price) };
  if (max_price)
    query.pricePerNight = { ...query.pricePerNight, $lte: parseInt(max_price) };

  // Property type
  if (property_type_id || room_types) {
    query.propertyType = property_type_id || room_types;
  }

  // Bedrooms and bathrooms
  if (min_bedrooms) query.bedrooms = { $gte: parseInt(min_bedrooms) };
  if (min_bathrooms) query.bathrooms = { $gte: parseInt(min_bathrooms) };

  // Amenities filtering
  if (amenities) {
    const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
    query.amenities = { $all: amenitiesArray };
  }

  // Sort options
  let sortOptions = {};
  if (sortBy === "price_asc" || sortBy === "price_low") {
    sortOptions.pricePerNight = 1;
  } else if (sortBy === "price_desc" || sortBy === "price_high") {
    sortOptions.pricePerNight = -1;
  } else if (sortBy === "recommended") {
    // Default sorting by rating or relevance
    sortOptions = { rating: -1 };
  }

  const listings = await Listing.find(query)
    .sort(sortOptions)
    .populate("hostId", "firstName lastName profilePhoto")
    .populate("amenities", "name")
    .exec();

  res.status(200).json({
    items: listings,
    search_metadata: {
      date_picker_type,
      location_search,
      monthly_length,
      search_type,
      total_results: listings.length,
    },
  });
};

// Get listing reviews
const getListingReviews = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if listing exists
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Get all reviews for the listing
    const Review = require("../models/Review.model");
    const reviews = await Review.find({ listingId: id })
      .populate("author", "firstName lastName profilePhoto createdAt")
      .sort({ createdAt: -1 });

    // Calculate review statistics
    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews
        ).toFixed(2)
        : 0;

    res.status(200).json({
      reviews,
      statistics: {
        totalReviews,
        avgRating: parseFloat(avgRating),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get host listings
const getHostListings = async (req, res) => {
  try {
    const hostId = req.user.id;
    const listings = await Listing.find({ hostId: hostId }) // Ensure this matches your schema (hostId vs host)
      .populate("amenities", "name")
      .populate("reviews");

    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get listing statistics
const getListingStats = async (req, res) => {
  try {
    const totalListings = await Listing.countDocuments({});
    
    // Calculate growth vs last month (including deletions)
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    // Count items created this month
    const currentMonthCreated = await Listing.countDocuments({
      createdAt: { $gte: startOfCurrentMonth }
    });
    
    // Count items created last month
    const lastMonthCreated = await Listing.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    
    // Count items deleted this month (if using soft delete or tracking deletedAt)
    const currentMonthDeleted = await Listing.countDocuments({
      deletedAt: { $gte: startOfCurrentMonth, $exists: true }
    });
    
    // Count items deleted last month
    const lastMonthDeleted = await Listing.countDocuments({
      deletedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth, $exists: true }
    });
    
    // Calculate net change (created - deleted)
    const currentMonthNet = currentMonthCreated - currentMonthDeleted;
    const lastMonthNet = lastMonthCreated - lastMonthDeleted;
    
    // Calculate total at end of last month (approximate)
    const totalAtEndOfLastMonth = totalListings - currentMonthNet;
    
    // Calculate growth percentage based on net change
    let growthPercentage = 0;
    if (totalAtEndOfLastMonth > 0) {
      growthPercentage = ((totalListings - totalAtEndOfLastMonth) / totalAtEndOfLastMonth * 100).toFixed(1);
    } else if (totalListings > 0) {
      growthPercentage = 100;
    }
    
    const stats = {
      totalListings,
      growthPercentage: parseFloat(growthPercentage),
      currentMonthCreated,
      currentMonthDeleted,
      lastMonthCreated,
      lastMonthDeleted
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  searchListings,
  getListingReviews,
  getHostListings,
  getListingStats,
};
