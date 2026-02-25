const express = require("express");
const cors = require("cors");
const pool = require("./db");
const errorHandler = require("./middleware/errorHandler");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json());

// ROUTES

// Health check
app.get("/", (req, res) => {
    res.json({ message: "Cashzi API is running." });
});

// Database connection test
app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ message: "Database Connected!", time: result.rows[0].now });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Database connection failed." });
    }
});

// API Route Groups
app.use("/api/auth", require("./routes/auth"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/budgets", require("./routes/budgets"));

// Global Error Handler (must be last)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`Cashzi server is running on port ${PORT}`);
});