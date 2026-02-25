const pool = require("../db");

// GET /api/categories
const getCategories = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get system defaults (user_id IS NULL) + user's custom categories
        const result = await pool.query(
            `SELECT id, name, is_default, user_id, created_at
             FROM categories
             WHERE is_default = TRUE OR user_id = $1
             ORDER BY is_default DESC, name ASC`,
            [userId]
        );

        res.json({ categories: result.rows });
    } catch (err) {
        next(err);
    }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ error: "Category name is required." });
        }

        // Check if user already has a category with this name
        const existing = await pool.query(
            `SELECT id FROM categories
             WHERE name ILIKE $1 AND (user_id = $2 OR is_default = TRUE)`,
            [name.trim(), userId]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "Category already exists." });
        }

        const result = await pool.query(
            `INSERT INTO categories (name, user_id, is_default)
             VALUES ($1, $2, FALSE)
             RETURNING id, name, user_id, is_default, created_at`,
            [name.trim(), userId]
        );

        res.status(201).json({ category: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

module.exports = { getCategories, createCategory };
