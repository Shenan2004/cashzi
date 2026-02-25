const { body, validationResult } = require("express-validator");

// Validation rules for setting a budget
const budgetRules = [
    body("category_id")
        .isInt({ min: 1 })
        .withMessage("Category ID must be a valid integer."),
    body("amount")
        .isFloat({ gt: 0 })
        .withMessage("Budget amount must be a positive number."),
    body("month")
        .isInt({ min: 1, max: 12 })
        .withMessage("Month must be between 1 and 12."),
    body("year")
        .isInt({ min: 2000 })
        .withMessage("Year must be a valid year (2000 or later).")
];

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = { budgetRules, validate };
