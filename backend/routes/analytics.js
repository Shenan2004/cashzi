const express = require("express");
const router = express.Router();
const authorize = require("../middleware/auth");
const { getMonthlySummary, getCategoryBreakdown, getTimeSeries } = require("../controllers/analyticsController");

// GET /api/analytics/summary?month=&year=
router.get("/summary", authorize, getMonthlySummary);

// GET /api/analytics/category-breakdown?month=&year=
router.get("/category-breakdown", authorize, getCategoryBreakdown);

// GET /api/analytics/trends?month=&year=
router.get("/trends", authorize, getTimeSeries);

module.exports = router;
