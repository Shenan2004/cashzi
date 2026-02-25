const express = require("express");
const router = express.Router();
const authorize = require("../middleware/auth");
const { getCategories, createCategory } = require("../controllers/categoryController");

// GET /api/categories — get all available categories
router.get("/", authorize, getCategories);

// POST /api/categories — create a custom category
router.post("/", authorize, createCategory);

module.exports = router;
