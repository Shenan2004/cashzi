const { body, validationResult } = require("express-validator");

// Validation rules for registration
const registerRules = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required."),
    body("email")
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email."),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long.")
];

// Validation rules for login
const loginRules = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email."),
    body("password")
        .notEmpty()
        .withMessage("Password is required.")
];

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = { registerRules, loginRules, validate };
