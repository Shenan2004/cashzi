const { body, validationResult } = require("express-validator");

// Validation rules for creating/updating a transaction
const transactionRules = [
    body("amount")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be a positive number."),
    body("type")
        .isIn(["income", "expense"])
        .withMessage("Type must be 'income' or 'expense'."),
    body("category_id")
        .isInt({ min: 1 })
        .withMessage("Category ID must be a valid integer."),
    body("date")
        .isISO8601()
        .withMessage("Date must be a valid date (YYYY-MM-DD)."),
    body("description")
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage("Description must be 255 characters or less.")
];

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = { transactionRules, validate };
