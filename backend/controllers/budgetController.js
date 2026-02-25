const pool = require("../db");

// POST /api/budgets
// Upsert — creates or updates a budget for a specific category/month/year
const setBudget = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { category_id, amount, month, year } = req.body;

        const result = await pool.query(
            `INSERT INTO budgets (user_id, category_id, amount, month, year)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, category_id, month, year)
             DO UPDATE SET amount = EXCLUDED.amount
             RETURNING id, user_id, category_id, amount, month, year, created_at`,
            [userId, category_id, amount, month, year]
        );

        res.status(201).json({ budget: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// GET /api/budgets?month=&year=
// Returns all budgets for the user for a given month/year
const getBudgets = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const result = await pool.query(
            `SELECT b.id, b.category_id, c.name AS category_name, b.amount AS budget_limit,
                    b.month, b.year
             FROM budgets b
             JOIN categories c ON b.category_id = c.id
             WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
             ORDER BY c.name ASC`,
            [userId, month, year]
        );

        res.json({ budgets: result.rows });
    } catch (err) {
        next(err);
    }
};

// GET /api/budgets/status?month=&year=
// Compares budget limits against actual spending for each budgeted category
const getBudgetStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const result = await pool.query(
            `SELECT
                b.id AS budget_id,
                b.category_id,
                c.name AS category_name,
                b.amount AS budget_limit,
                COALESCE(SUM(t.amount), 0) AS spent,
                b.amount - COALESCE(SUM(t.amount), 0) AS remaining,
                ROUND(
                    (COALESCE(SUM(t.amount), 0) / b.amount) * 100, 1
                ) AS percentage_used
             FROM budgets b
             JOIN categories c ON b.category_id = c.id
             LEFT JOIN transactions t
                ON t.user_id = b.user_id
                AND t.category_id = b.category_id
                AND t.type = 'expense'
                AND EXTRACT(MONTH FROM t.date) = b.month
                AND EXTRACT(YEAR FROM t.date) = b.year
             WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
             GROUP BY b.id, b.category_id, c.name, b.amount
             ORDER BY percentage_used DESC`,
            [userId, month, year]
        );

        const statuses = result.rows.map(row => ({
            budget_id: row.budget_id,
            category_id: row.category_id,
            category_name: row.category_name,
            limit: parseFloat(row.budget_limit),
            spent: parseFloat(row.spent),
            remaining: parseFloat(row.remaining),
            percentage_used: parseFloat(row.percentage_used),
            alert: parseFloat(row.percentage_used) >= 90
                ? "⚠️ You are at or near your budget limit!"
                : null
        }));

        res.json({ month, year, statuses });
    } catch (err) {
        next(err);
    }
};

module.exports = { setBudget, getBudgets, getBudgetStatus };
