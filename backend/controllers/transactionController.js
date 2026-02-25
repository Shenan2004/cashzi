const pool = require("../db");

// POST /api/transactions
const createTransaction = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { amount, type, category_id, date, description } = req.body;

        const result = await pool.query(
            `INSERT INTO transactions (user_id, amount, type, category_id, date, description)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, user_id, amount, type, category_id, date, description, created_at`,
            [userId, amount, type, category_id, date, description || null]
        );

        res.status(201).json({ transaction: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// GET /api/transactions
// Supports query params: ?month=&year=&category_id=
const getAllTransactions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { month, year, category_id } = req.query;

        let query = `
            SELECT t.id, t.amount, t.type, t.category_id, c.name as category_name,
                   t.date, t.description, t.created_at
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1
        `;
        const params = [userId];
        let paramIndex = 2;

        // Filter by month
        if (month) {
            query += ` AND EXTRACT(MONTH FROM t.date) = $${paramIndex}`;
            params.push(parseInt(month));
            paramIndex++;
        }

        // Filter by year
        if (year) {
            query += ` AND EXTRACT(YEAR FROM t.date) = $${paramIndex}`;
            params.push(parseInt(year));
            paramIndex++;
        }

        // Filter by category
        if (category_id) {
            query += ` AND t.category_id = $${paramIndex}`;
            params.push(parseInt(category_id));
            paramIndex++;
        }

        query += ` ORDER BY t.date DESC, t.created_at DESC`;

        const result = await pool.query(query, params);

        res.json({ transactions: result.rows });
    } catch (err) {
        next(err);
    }
};

// PUT /api/transactions/:id
const updateTransaction = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const transactionId = req.params.id;
        const { amount, type, category_id, date, description } = req.body;

        // Verify ownership
        const existing = await pool.query(
            "SELECT id FROM transactions WHERE id = $1 AND user_id = $2",
            [transactionId, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: "Transaction not found or access denied." });
        }

        const result = await pool.query(
            `UPDATE transactions
             SET amount = $1, type = $2, category_id = $3, date = $4, description = $5
             WHERE id = $6 AND user_id = $7
             RETURNING id, user_id, amount, type, category_id, date, description, created_at`,
            [amount, type, category_id, date, description || null, transactionId, userId]
        );

        res.json({ transaction: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const transactionId = req.params.id;

        // Verify ownership and delete
        const result = await pool.query(
            "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id",
            [transactionId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Transaction not found or access denied." });
        }

        res.json({ message: "Transaction deleted successfully." });
    } catch (err) {
        next(err);
    }
};

module.exports = { createTransaction, getAllTransactions, updateTransaction, deleteTransaction };
