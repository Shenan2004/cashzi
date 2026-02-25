const express = require("express");
const router = express.Router();
const authorize = require("../middleware/auth");
const { budgetRules, validate } = require("../validators/budgetValidator");
const { setBudget, getBudgets, getBudgetStatus } = require("../controllers/budgetController");

// POST /api/budgets — set or update a budget
router.post("/", authorize, budgetRules, validate, setBudget);

// GET /api/budgets?month=&year= — list budgets for a month
router.get("/", authorize, getBudgets);

// GET /api/budgets/status?month=&year= — compare budgets vs actual spending
router.get("/status", authorize, getBudgetStatus);

module.exports = router;
