const RecentlyViewed = require("../models/RecentlyViewed.model");
const Listing = require("../models/Listing.model");
const User = require("../models/User.model");

const syncUserRecentlyViewed = async (userId) => {
  const views = await RecentlyViewed.find({ user: userId })
    .sort({ viewedAt: -1 })
    .limit(10)
    .select("_id");

  await User.updateOne(
    { _id: userId },
    { $set: { recentlyViewed: views.map((view) => view._id) } }
  );
};

// Add a listing to recently viewed
const addRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware
    const { listingId } = req.params;

    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check if already viewed
    const existing = await RecentlyViewed.findOne({
      user: userId,
      listing: listingId,
    });

    if (existing) {
      // Update viewedAt timestamp
      existing.viewedAt = new Date();
      await existing.save();
      await syncUserRecentlyViewed(userId);
      return res.json({
        message: "Recently viewed updated",
        recentlyViewed: existing,
      });
    }

    // Create new recently viewed entry
    const newView = await RecentlyViewed.create({
      user: userId,
      listing: listingId,
    });

    // Keep only the 10 most recent views for this user
    const userViews = await RecentlyViewed.find({ user: userId })
      .sort({ viewedAt: -1 })
      .skip(10);

    // Delete older views beyond the 10 most recent
    if (userViews.length > 0) {
      await RecentlyViewed.deleteMany({
        _id: { $in: userViews.map((v) => v._id) },
      });
    }
    await syncUserRecentlyViewed(userId);

    return res.status(201).json({
      message: "Added to recently viewed",
      recentlyViewed: newView,
    });
  } catch (err) {
    console.error("Add recently viewed error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's recently viewed listings
const getRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user._id;

    const recentlyViewed = await RecentlyViewed.find({ user: userId })
      .populate({
        path: "listing",
        select:
          "title description propertyType address pricePerNight cleaningFee maxGuests bedrooms bathrooms images amenities ratingAvg",
      })
      .sort({ viewedAt: -1 })
      .limit(10);

    // Filter out any entries where listing might have been deleted
    const validViews = recentlyViewed.filter((view) => view.listing);

    res.json({
      recentlyViewed: validViews.map((view) => view.listing),
    });
  } catch (err) {
    console.error("Get recently viewed error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Clear user's recently viewed history
const clearRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user._id;

    await RecentlyViewed.deleteMany({ user: userId });
    await User.updateOne({ _id: userId }, { $set: { recentlyViewed: [] } });

    res.json({ message: "Recently viewed history cleared" });
  } catch (err) {
    console.error("Clear recently viewed error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addRecentlyViewed,
  getRecentlyViewed,
  clearRecentlyViewed,
};
