const express = require("express");
const cors = require("cors");
const pool = require("./db"); // We will create this db.js file next
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to parse JSON bodies

// ROUTES

// 1. Test Route (Check if server is running)
app.get("/", (req, res) => {
    res.json({ message: "Server is running on port 5000" });
});

// 2. Database Connection Test
app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ message: "Database Connected!", time: result.rows[0].now });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});