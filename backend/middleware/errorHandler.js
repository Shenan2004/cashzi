// Global error handler — catches unhandled errors and returns a clean response
const errorHandler = (err, req, res, next) => {
    console.error("Server Error:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
};

module.exports = errorHandler;
