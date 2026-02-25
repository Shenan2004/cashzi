const express = require("express");
const router = express.Router();
const authorize = require("../middleware/auth");
const { transactionRules, validate } = require("../validators/transactionValidator");
const {
    createTransaction,
    getAllTransactions,
    updateTransaction,
    deleteTransaction
} = require("../controllers/transactionController");

// POST /api/transactions — create a new transaction
router.post("/", authorize, transactionRules, validate, createTransaction);

// GET /api/transactions — get all transactions (supports ?month=&year=&category_id=)
router.get("/", authorize, getAllTransactions);

// PUT /api/transactions/:id — update a transaction
router.put("/:id", authorize, transactionRules, validate, updateTransaction);

// DELETE /api/transactions/:id — delete a transaction
router.delete("/:id", authorize, deleteTransaction);

module.exports = router;
