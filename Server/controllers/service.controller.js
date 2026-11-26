const { validateCloudinaryImageUrls } = require('../config/cloudinary');
const Service = require('../models/Service.model');
const User = require('../models/User.model');

const parseIfString = (value) => {
  if (typeof value !== 'string') return value;
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

// @desc    Create new service listing
// @route   POST /api/services
// @access  Private
const createService = async (req, res) => {
  try {
    let {
      title,
      description,
      serviceCategory,
      location,
      hourlyRate,
      packages,
      availability,
      requirements,
      skills,
      serviceDetails
    } = req.body;

    location = parseIfString(location);
    packages = parseIfString(packages);
    availability = parseIfString(availability);
    requirements = parseIfString(requirements);
    skills = parseIfString(skills);
    serviceDetails = parseIfString(serviceDetails);
    const uploadedImages = getImageUrls(req.body.images, req.user._id).map(
      (url) => ({ url, alt: "Service photo" })
    );

    const service = await Service.create({
      title,
      description,
      serviceCategory,
      location,
      hourlyRate,
      packages,
      availability,
      requirements,
      skills,
      images: uploadedImages,
      serviceDetails,
      host: req.user._id
    });
    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { services: service._id } }
    );

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const { city, country, serviceCategory, priceRange, categories, page = 1, limit = 10 } = req.query;

    const query = { status: 'active' };

    if (city) query['location.city'] = new RegExp(city, 'i');
    if (country) query['location.country'] = new RegExp(country, 'i');

    // Handle Price Range
    if (priceRange) {
      try {
        const [min, max] = JSON.parse(priceRange);
        query.hourlyRate = { $gte: Number(min), $lte: Number(max) };
      } catch (error) {
        console.error('Error parsing priceRange:', error);
      }
    }

    // Handle Categories
    if (categories) {
      try {
        const cats = JSON.parse(categories);
        if (cats.length > 0) {
          query.serviceCategory = { $in: cats };
        }
      } catch (error) {
        console.error('Error parsing categories:', error);
      }
    } else if (serviceCategory) {
      query.serviceCategory = serviceCategory;
    }

    const services = await Service.find(query)
      .populate('host', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Service.countDocuments(query);

    res.status(200).json({
      success: true,
      count: services.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('host', 'name email');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private
const updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check ownership
    if (service.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service'
      });
    }

    const {
      title,
      description,
      serviceCategory,
      hourlyRate,
      packages,
      availability,
      requirements,
      skills,
      serviceDetails,
      status
    } = req.body;

    const updateData = {};

    // Basic fields
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (serviceCategory !== undefined) updateData.serviceCategory = serviceCategory;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (status !== undefined) updateData.status = status;

    // Location
    if (req.body.location !== undefined) {
      updateData.location =
        typeof req.body.location === 'string'
          ? JSON.parse(req.body.location)
          : req.body.location;
    }

    // Arrays
    if (req.body.skills !== undefined) {
      updateData.skills = Array.isArray(req.body.skills)
        ? req.body.skills
        : JSON.parse(req.body.skills);
    }

    if (req.body.requirements !== undefined) {
      updateData.requirements = Array.isArray(req.body.requirements)
        ? req.body.requirements
        : JSON.parse(req.body.requirements);
    }

    if (req.body.packages !== undefined) {
      updateData.packages = Array.isArray(req.body.packages)
        ? req.body.packages
        : JSON.parse(req.body.packages);
    }

    if (req.body.availability !== undefined) {
      updateData.availability = Array.isArray(req.body.availability)
        ? req.body.availability
        : JSON.parse(req.body.availability);
    }
    // Service details
    if (serviceDetails !== undefined) {
      updateData.serviceDetails =
        typeof serviceDetails === 'string'
          ? JSON.parse(serviceDetails)
          : serviceDetails;
    }

    if (req.body.removedImages) {
      const parsedRemovedImages = parseIfString(req.body.removedImages);
      const removedImages = Array.isArray(parsedRemovedImages)
        ? parsedRemovedImages
        : [];
      service.images = service.images.filter(
        img => !removedImages.includes(img._id.toString())
      );
    }

    if (req.body.images !== undefined) {
      const newImageUrls = getImageUrls(req.body.images, req.user._id);
      service.images.push(
        ...newImageUrls.map((url) => ({ url, alt: "Service photo" }))
      );
    }

    updateData.images = service.images;

    service = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check ownership
    if (service.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service'
      });
    }

    await service.deleteOne();
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { services: service._id } }
    );

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get host's services
// @route   GET /api/services/host
// @access  Private
const getHostServices = async (req, res) => {
  try {
    const services = await Service.find({ host: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get service statistics
const getServiceStats = async (req, res) => {
  try {
    const totalServices = await Service.countDocuments({});

    // Calculate growth vs last month (including deletions)
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Count items created this month
    const currentMonthCreated = await Service.countDocuments({
      createdAt: { $gte: startOfCurrentMonth }
    });

    // Count items created last month
    const lastMonthCreated = await Service.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    // Count items deleted this month (if using soft delete or tracking deletedAt)
    const currentMonthDeleted = await Service.countDocuments({
      deletedAt: { $gte: startOfCurrentMonth, $exists: true }
    });

    // Count items deleted last month
    const lastMonthDeleted = await Service.countDocuments({
      deletedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth, $exists: true }
    });

    // Calculate net change (created - deleted)
    const currentMonthNet = currentMonthCreated - currentMonthDeleted;
    const lastMonthNet = lastMonthCreated - lastMonthDeleted;

    // Calculate total at end of last month (approximate)
    const totalAtEndOfLastMonth = totalServices - currentMonthNet;

    // Calculate growth percentage based on net change
    let growthPercentage = 0;
    if (totalAtEndOfLastMonth > 0) {
      growthPercentage = ((totalServices - totalAtEndOfLastMonth) / totalAtEndOfLastMonth * 100).toFixed(1);
    } else if (totalServices > 0) {
      growthPercentage = 100;
    }

    const stats = {
      totalServices,
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
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getHostServices,
  getServiceStats
};
