const Experience = require("../models/Experience.model");
const User = require("../models/User.model");
const { uploadOnCloudinary } = require("../config/cloudinary");

// @desc    Create new experience listing
// @route   POST /api/experiences
// @access  Private
const createExperience = async (req, res) => {
  try {
    const {
      title,
      description,
      experienceType,
      street,
      city,
      country,
      coordinates,
      pricePerPerson,
      duration,
      groupSize,
      schedule,
      ageRequirement,
      fitnessLevel,
      requirements,
      inclusions,
    } = req.body;

    // Parse JSON strings back to objects
    const parsedGroupSize = groupSize ? JSON.parse(groupSize) : {};
    const parsedSchedule = schedule ? JSON.parse(schedule) : [];
    const parsedRequirements = requirements ? JSON.parse(requirements) : [];
    const parsedInclusions = inclusions ? JSON.parse(inclusions) : [];
    const parsedCoordinates = coordinates ? JSON.parse(coordinates) : {};

    // Handle images
    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadOnCloudinary(file.path);
        uploadedImages.push({
          url: result.secure_url,
          caption: "Experience photo",
        });
      }
    }

    // Validate required location fields
    if (!city || !country) {
      return res.status(400).json({
        success: false,
        message: "City and country are required",
      });
    }

    const experience = await Experience.create({
      title,
      description,
      experienceType,
      location: {
        street,
        city,
        country,
        coordinates: parsedCoordinates,
      },
      pricePerPerson,
      duration,
      groupSize: parsedGroupSize,
      schedule: parsedSchedule,
      ageRequirement,
      fitnessLevel,
      requirements: parsedRequirements,
      images: uploadedImages,
      inclusions: parsedInclusions,
      host: req.user._id,
    });
    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { experiences: experience._id } }
    );

    res.status(201).json({
      success: true,
      data: experience,
    });
  } catch (error) {
    console.error("Error creating experience:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all experiences
// @route   GET /api/experiences
// @access  Public
const getExperiences = async (req, res) => {
  try {
    const {
      city,
      country,
      experienceType,
      page = 1,
      limit = 10,
      priceRange,
      categories,
      minRating,
    } = req.query;

    const query = { status: "active" };

    if (city) query["location.city"] = new RegExp(city, "i");
    if (country) query["location.country"] = new RegExp(country, "i");
    if (experienceType) query.experienceType = experienceType;

    // Price range filter
    if (priceRange) {
      const [minPrice, maxPrice] = JSON.parse(priceRange);
      query.pricePerPerson = { $gte: minPrice, $lte: maxPrice };
    }

    // Categories filter
    if (categories) {
      const categoryArray = JSON.parse(categories);
      if (categoryArray.length > 0) {
        query.experienceType = { $in: categoryArray };
      }
    }

    // Rating filter (assuming you have a rating field)
    if (minRating && parseFloat(minRating) > 0) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    const experiences = await Experience.find(query)
      .populate("host", "name email")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Experience.countDocuments(query);

    res.status(200).json({
      success: true,
      count: experiences.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: experiences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single experience
// @route   GET /api/experiences/:id
// @access  Public
const getExperience = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id).populate(
      "host",
      "name email"
    );

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    res.status(200).json({
      success: true,
      data: experience,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update experience
// @route   PUT /api/experiences/:id
// @access  Private
// const updateExperience = async (req, res) => {
//   try {
//     let experience = await Experience.findById(req.params.id);
//     if (!experience)
//       return res
//         .status(404)
//         .json({ success: false, message: "Experience not found" });

//     if (experience.host.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "Not authorized to update this experience",
//       });
//     }

//     const {
//       title,
//       description,
//       experienceType,
//       street,
//       city,
//       country,
//       coordinates,
//       pricePerPerson,
//       duration,
//       groupSize,
//       schedule,
//       ageRequirement,
//       fitnessLevel,
//       requirements,
//       inclusions,
//       status,
//     } = req.body;

//     // Parse JSON strings if they exist
//     const parsedGroupSize = groupSize
//       ? JSON.parse(groupSize)
//       : experience.groupSize;
//     const parsedSchedule = schedule
//       ? JSON.parse(schedule)
//       : experience.schedule;
//     const parsedRequirements = requirements
//       ? JSON.parse(requirements)
//       : experience.requirements;
//     const parsedInclusions = inclusions
//       ? JSON.parse(inclusions)
//       : experience.inclusions;
//     const parsedCoordinates = coordinates
//       ? JSON.parse(coordinates)
//       : experience.location?.coordinates;
//     let location = experience.location;
//     if (street) location.street = street;
//     if (city) location.city = city;
//     if (country) location.country = country;

//     if (coordinates) {
//       const parsedCoordinates = JSON.parse(coordinates);

//       if (parsedCoordinates.lat !== undefined) location.coordinates.lat = parsedCoordinates.lat;

//       if (parsedCoordinates.lng !== undefined) location.coordinates.lng = parsedCoordinates.lng;
//     }
//     let uploadedImages = experience.images;

//     // Images
//     // Remove deleted images
//     // Remove images from uploadOnCloudinary
//     // parsing string to json
//     const parseIfString = (value) => {
//       if (typeof value === "string") {
//         try {
//           return JSON.parse(value);
//         } catch {
//           return value;
//         }
//       }
//       return value;
//     };
//     /* ---------- REMOVE IMAGES ---------- */
//     if (req.body.removedImages) {
//       const removedImages = Array.isArray(parseIfString(req.body.removedImages))
//         ? parseIfString(req.body.removedImages)
//         : [];
//       experience.images = experience.images.filter(
//         img => !removedImages.includes(img._id.toString())
//       );
//     }

//     /* ---------- ADD NEW IMAGES ---------- */
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const result = await uploadOnCloudinary(file.path);
//         experience.images.push({
//           url: result.secure_url,
//           caption: "Experience photo",
//         });
//       }
//     }

//     experience = await Experience.findByIdAndUpdate(
//       req.params.id,
//       {
//         title,
//         description,
//         experienceType,
//         location: {
//           street: street || experience.location?.street,
//           city: city || experience.location?.city,
//           country: country || experience.location?.country,
//           coordinates: parsedCoordinates,
//         },
//         pricePerPerson,
//         duration,
//         groupSize: parsedGroupSize,
//         schedule: parsedSchedule,
//         ageRequirement,
//         fitnessLevel,
//         requirements: parsedRequirements,
//         images: experience.images,
//         inclusions: parsedInclusions,
//         status,
//       },
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({ success: true, data: experience });
//   } catch (error) {
//     console.error("Error updating experience:", error);
//     res.status(400).json({ success: false, message: error.message });
//   }
// };
const updateExperience = async (req, res) => {
  try {

    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      return res
        .status(404)
        .json({ success: false, message: "Experience not found" });
    }

    if (experience.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this experience",
      });
    }

    const {
      title,
      description,
      experienceType,
      pricePerPerson,
      duration,
      groupSize,
      schedule,
      ageRequirement,
      fitnessLevel,
      requirements,
      inclusions,
      status,
      removedImages,
    } = req.body;

    const parsedGroupSize = groupSize
      ? JSON.parse(groupSize)
      : experience.groupSize;

    const parsedSchedule = schedule
      ? JSON.parse(schedule)
      : experience.schedule;

    const parsedRequirements = requirements
      ? JSON.parse(requirements)
      : experience.requirements;

    const parsedInclusions = inclusions
      ? JSON.parse(inclusions)
      : experience.inclusions;

    let parsedLocation = null;
    if (req.body.location) {
      parsedLocation =
        typeof req.body.location === "string"
          ? JSON.parse(req.body.location)
          : req.body.location;
    }

    // Remove images
    if (removedImages) {
      const removedIds =
        typeof removedImages === "string"
          ? JSON.parse(removedImages)
          : removedImages;

      experience.images = experience.images.filter(
        img => !removedIds.includes(img._id.toString())
      );
    }

    // Add new images
    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadOnCloudinary(file.path);
        experience.images.push({
          url: result.secure_url,
          caption: "Experience photo",
        });
      }
    }

    const updateData = {
      title,
      description,
      experienceType,
      pricePerPerson,
      duration,
      groupSize: parsedGroupSize,
      schedule: parsedSchedule,
      ageRequirement,
      fitnessLevel,
      requirements: parsedRequirements,
      inclusions: parsedInclusions,
      status,
      images: experience.images,
    };

    if (parsedLocation) {
      if (parsedLocation.street !== undefined)
        updateData["location.street"] = parsedLocation.street;

      if (parsedLocation.city !== undefined)
        updateData["location.city"] = parsedLocation.city;

      if (parsedLocation.country !== undefined)
        updateData["location.country"] = parsedLocation.country;

      if (parsedLocation.coordinates) {
        if (parsedLocation.coordinates.lat !== undefined)
          updateData["location.coordinates.lat"] = Number(
            parsedLocation.coordinates.lat
          );

        if (parsedLocation.coordinates.lng !== undefined)
          updateData["location.coordinates.lng"] = Number(
            parsedLocation.coordinates.lng
          );
      }
    }

    const updatedExperience = await Experience.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedExperience,
    });
  } catch (error) {
    console.error("Error updating experience:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete experience
// @route   DELETE /api/experiences/:id
// @access  Private
const deleteExperience = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    // Check ownership
    if (experience.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this experience",
      });
    }

    await experience.deleteOne();
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { experiences: experience._id } }
    );

    res.status(200).json({
      success: true,
      message: "Experience deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get host's experiences
// @route   GET /api/experiences/host
// @access  Private
const getHostExperiences = async (req, res) => {
  try {
    const experiences = await Experience.find({ host: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: experiences.length,
      data: experiences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get experience statistics
const getExperienceStats = async (req, res) => {
  try {
    const totalExperiences = await Experience.countDocuments({});
    
    // Calculate growth vs last month (including deletions)
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    // Count items created this month
    const currentMonthCreated = await Experience.countDocuments({
      createdAt: { $gte: startOfCurrentMonth }
    });
    
    // Count items created last month
    const lastMonthCreated = await Experience.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    
    // Count items deleted this month (if using soft delete or tracking deletedAt)
    const currentMonthDeleted = await Experience.countDocuments({
      deletedAt: { $gte: startOfCurrentMonth, $exists: true }
    });
    
    // Count items deleted last month
    const lastMonthDeleted = await Experience.countDocuments({
      deletedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth, $exists: true }
    });
    
    // Calculate net change (created - deleted)
    const currentMonthNet = currentMonthCreated - currentMonthDeleted;
    const lastMonthNet = lastMonthCreated - lastMonthDeleted;
    
    // Calculate total at end of last month (approximate)
    const totalAtEndOfLastMonth = totalExperiences - currentMonthNet;
    
    // Calculate growth percentage based on net change
    let growthPercentage = 0;
    if (totalAtEndOfLastMonth > 0) {
      growthPercentage = ((totalExperiences - totalAtEndOfLastMonth) / totalAtEndOfLastMonth * 100).toFixed(1);
    } else if (totalExperiences > 0) {
      growthPercentage = 100;
    }
    
    const stats = {
      totalExperiences,
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
  createExperience,
  getExperiences,
  getExperience,
  updateExperience,
  deleteExperience,
  getHostExperiences,
  getExperienceStats,
};
