const express = require("express");
const router = express.Router();
const {
  createExperience,
  getExperiences,
  getExperience,
  updateExperience,
  deleteExperience,
  getHostExperiences,
  getExperienceStats,
} = require("../controllers/experience.controller.js");
const auth = require("../middleware/userMiddleware.js");

// Public routes
router.get('/stats', getExperienceStats);
router.get('/', getExperiences);

// Protected routes (require authentication)
router.get('/host/my-experiences', auth, getHostExperiences);
router.get('/:id', getExperience);

// Protected routes (require authentication)
router.post('/', auth, createExperience);
router.put('/:id', auth, updateExperience);
router.delete('/:id', auth, deleteExperience);


module.exports = router;
