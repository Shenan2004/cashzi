const pool = require("../db");

// GET /api/analytics/summary?month=&year=
// Returns total income, total expenses, and net balance for a given month
const getMonthlySummary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const result = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses
             FROM transactions
             WHERE user_id = $1
               AND EXTRACT(MONTH FROM date) = $2
               AND EXTRACT(YEAR FROM date) = $3`,
            [userId, month, year]
        );

        const { total_income, total_expenses } = result.rows[0];
        const balance = parseFloat(total_income) - parseFloat(total_expenses);

        res.json({
            month,
            year,
            total_income: parseFloat(total_income),
            total_expenses: parseFloat(total_expenses),
            balance
        });
    } catch (err) {
        next(err);
    }
};

// GET /api/analytics/category-breakdown?month=&year=
// Groups expenses by category — formatted for a pie chart
const getCategoryBreakdown = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const result = await pool.query(
            `SELECT c.name AS category, SUM(t.amount) AS total
             FROM transactions t
             JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = $1
               AND t.type = 'expense'
               AND EXTRACT(MONTH FROM t.date) = $2
               AND EXTRACT(YEAR FROM t.date) = $3
             GROUP BY c.name
             ORDER BY total DESC`,
            [userId, month, year]
        );

        const breakdown = result.rows.map(row => ({
            category: row.category,
            total: parseFloat(row.total)
        }));

        res.json({ month, year, breakdown });
    } catch (err) {
        next(err);
    }
};

// GET /api/analytics/trends?month=&year=
// Groups expenses by day — formatted for a line graph
const getTimeSeries = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const result = await pool.query(
            `SELECT t.date, SUM(t.amount) AS total
             FROM transactions t
             WHERE t.user_id = $1
               AND t.type = 'expense'
               AND EXTRACT(MONTH FROM t.date) = $2
               AND EXTRACT(YEAR FROM t.date) = $3
             GROUP BY t.date
             ORDER BY t.date ASC`,
            [userId, month, year]
        );

        const trends = result.rows.map(row => ({
            date: row.date,
            total: parseFloat(row.total)
        }));

        res.json({ month, year, trends });
    } catch (err) {
        next(err);
    }
};

module.exports = { getMonthlySummary, getCategoryBreakdown, getTimeSeries };
