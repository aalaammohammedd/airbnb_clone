const express = require("express");
const router = express.Router();
const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  searchListings,
  getListingReviews,
  getHostListings,
  getListingStats,
} = require("../controllers/listing.controller.js");

const protect = require("../middleware/userMiddleware.js");
const authenticateUser = require("../middleware/authUser.js");

/**
 * @swagger
 * tags:
 *   name: Listings
 *   description: CRUD operations for property listings
 */

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all listings (public)
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: List of all listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   pricePerNight:
 *                     type: number
 *                   maxGuests:
 *                     type: number
 *                   propertyType:
 *                     type: string
 *                   location:
 *                     type: object
 *                     properties:
 *                       address:
 *                         type: string
 *                       city:
 *                         type: string
 *                       country:
 *                         type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get("/listings/stats", getListingStats);
router.get("/listings", getListings);

/**
 * @swagger
 * /listings/search:
 *   get:
 *     summary: Search listings with filters
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *       - in: query
 *         name: location_search
 *         schema:
 *           type: string
 *       - in: query
 *         name: checkin
 *         schema:
 *           type: string
 *       - in: query
 *         name: checkout
 *         schema:
 *           type: string
 *       - in: query
 *         name: adults
 *         schema:
 *           type: string
 *       - in: query
 *         name: children
 *         schema:
 *           type: string
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: string
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: string
 *       - in: query
 *         name: property_type_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: min_bedrooms
 *         schema:
 *           type: string
 *       - in: query
 *         name: min_bathrooms
 *         schema:
 *           type: string
 *       - in: query
 *         name: amenities
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/listings/search", searchListings);

/**
 * @swagger
 * /listings/host/my-listings:
 *   get:
 *     summary: Get all listings for the authenticated host
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of host's listings
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/listings/host/my-listings",
  protect, // Ensure 'protect' middleware is used to populate req.user
  authenticateUser(["host", "admin"]),
  getHostListings
);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get a listing by ID (public)
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Listing ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing details
 *       404:
 *         description: Listing not found
 */
router.get("/listings/:id", getListingById);

/**
 * @swagger
 * /listings:
 *   post:
 *     summary: Create a new listing (host/admin)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - pricePerNight
 *               - maxGuests
 *               - propertyType
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 example: Modern Apartment in Downtown
 *               description:
 *                 type: string
 *                 example: A cozy apartment located in the heart of the city.
 *               pricePerNight:
 *                 type: number
 *                 example: 120
 *               maxGuests:
 *                 type: number
 *                 example: 3
 *               propertyType:
 *                 type: string
 *                 example: apartment
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                     example: 123 Main Street
 *                   city:
 *                     type: string
 *                     example: Cairo
 *                   country:
 *                     type: string
 *                     example: Egypt
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: https://example.com/image1.jpg
 *     responses:
 *       201:
 *         description: Listing created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/listings",
  protect,
  authenticateUser(["host", "admin"]),
  createListing
);

/**
 * @swagger
 * /listings/{id}:
 *   put:
 *     summary: Update a listing by ID (host/admin)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Listing ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               pricePerNight:
 *                 type: number
 *               maxGuests:
 *                 type: number
 *               propertyType:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *       404:
 *         description: Listing not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/listings/:id",
  protect,
  authenticateUser(["host", "admin"]),
  updateListing
);

/**
 * @swagger
 * /listings/{id}:
 *   patch:
 *     summary: Update a listing by ID (host/admin)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Listing ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               pricePerNight:
 *                 type: number
 *               maxGuests:
 *                 type: number
 *               propertyType:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *       404:
 *         description: Listing not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/listings/:id",
  protect,
  authenticateUser(["host", "admin"]),
  updateListing
);

/**
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Delete a listing by ID (host/admin)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Listing ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 *       404:
 *         description: Listing not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/listings/:id",
  protect,
  authenticateUser(["host", "admin"]),
  deleteListing
);

/**
 * @swagger
 * /listings/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a specific listing
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Listing ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         description: Listing not found
 */
router.get("/listings/:id/reviews", getListingReviews);

module.exports = router;