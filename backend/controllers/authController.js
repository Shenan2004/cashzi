const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
require("dotenv").config();

// Generate JWT token
const generateToken = (user_id) => {
    return jwt.sign({ user_id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if email already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Email already registered." });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const newUser = await pool.query(
            "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
            [name, email, password_hash]
        );

        const user = newUser.rows[0];

        // Generate token
        const token = generateToken(user.id);

        res.status(201).json({
            message: "Registration successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const result = await pool.query(
            "SELECT id, name, email, password_hash FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const user = result.rows[0];

        // Compare password with hash
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        // Generate token
        const token = generateToken(user.id);

        res.json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login };
